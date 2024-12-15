import { Typography } from "@mui/material";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { Trans, useTranslation } from "i18n";
import { usePersistedState } from "platform/usePersistedState";
import { tosRoute } from "routes";
import { useIsMounted } from "utils/hooks";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "fixed",
    zIndex: theme.zIndex.snackbar,
    left: theme.spacing(0),
    right: theme.spacing(0),
    transform: "translateY(-100%)",
    backgroundColor: theme.palette.primary.contrastText,
    top: "100vh",
    padding: theme.spacing(2, 4),
    "& .content": {
      width: "75%",
      margin: "0 auto",
      textAlign: "center",
    },
  },
  link: {
    color: theme.palette.secondary.light,
  },
  button: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    right: theme.spacing(1),
  },
}));

export default function CookieBanner() {
  const { t } = useTranslation();
  const classes = useStyles();
  // since we are using localStorage, make sure don't render unless mounted
  // or there will be hydration mismatches
  const isMounted = useIsMounted().current;
  const auth = useAuthContext();
  const [hasSeen, setHasSeen] = usePersistedState("hasSeenCookieBanner", false);

  if (auth.authState.authenticated) return null;

  //specifically not using our snackbar, which is designed for alerts
  return isMounted && !hasSeen ? (
    <div className={classes.root} aria-live="polite">
      <IconButton
        aria-label={t("close")}
        onClick={() => setHasSeen(true)}
        className={classes.button}
      >
        <CloseIcon />
      </IconButton>
      <div className="content">
        <Typography variant="body1">
          <Trans t={t} i18nKey="cookie_message">
            We use cookies to ensure that we give you the best experience on our
            website. If you continue to use this site, we will assume that you
            are happy with it. You can read more about our
            <StyledLink href={tosRoute} className={classes.link}>
              Terms of Service
            </StyledLink>
            .
          </Trans>
        </Typography>
      </div>
    </div>
  ) : null;
}
