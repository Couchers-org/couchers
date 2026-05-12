import { styled, Typography } from "@mui/material";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { usePersistedState } from "platform/usePersistedState";
import { useEffect, useRef } from "react";
import { tosRoute } from "routes";
import { useIsMounted } from "utils/hooks";
import { useIsNativeEmbed } from "utils/nativeLink";

const StyledWrapper = styled("div")(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.snackbar,
  backgroundColor: "var(--mui-palette-background-paper)",
  padding: theme.spacing(2, 4),
  boxShadow: theme.shadows[4],

  "& .content": {
    width: "75%",
    margin: "0 auto",
    textAlign: "center",
  },
}));

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
}));

export default function CookieBanner() {
  const { t } = useTranslation();
  // since we are using localStorage, make sure don't render unless mounted
  // or there will be hydration mismatches
  const isMounted = useIsMounted().current;
  const [hasSeen, setHasSeen] = usePersistedState("hasSeenCookieBanner", false);
  const isNativeEmbed = useIsNativeEmbed();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--cookie-banner-height",
        `${el.offsetHeight}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--cookie-banner-height");
    };
  }, [hasSeen, isMounted]);

  if (isNativeEmbed) return null;

  //specifically not using our snackbar, which is designed for alerts
  return isMounted && !hasSeen ? (
    <StyledWrapper ref={bannerRef} aria-live="polite">
      <StyledCloseButton
        aria-label={t("close")}
        onClick={() => setHasSeen(true)}
      >
        <CloseIcon />
      </StyledCloseButton>
      <div className="content">
        <Typography variant="body2">
          <Trans t={t} i18nKey="cookie_message">
            We use cookies to ensure that we give you the best experience on our
            website. If you continue to use this site, we will assume that you
            are happy with it. You can read more about our
            <StyledLink
              href={tosRoute}
              sx={{ color: "var(--mui-palette-secondary-light)" }}
            >
              Terms of Service
            </StyledLink>
            .
          </Trans>
        </Typography>
      </div>
    </StyledWrapper>
  ) : null;
}
