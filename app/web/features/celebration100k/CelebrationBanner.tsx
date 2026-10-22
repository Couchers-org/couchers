import { Replay } from "@mui/icons-material";
import { alpha, Box, Button, ButtonBase, styled, Typography, useMediaQuery } from "@mui/material";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { COUCHERS_LOGO_PATHS } from "resources/couchersLogoPaths";
import { theme } from "theme";

import { CELEBRATION_100K_BLOG_URL, CELEBRATION_100K_DONATE_URL } from "./constants";

interface CelebrationBannerProps {
  onReplay: () => void;
}

const StyledBanner = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // Longer translations wrap: the buttons move to a second row together instead of overflowing
  flexWrap: "wrap",
  columnGap: theme.spacing(1),
  rowGap: theme.spacing(0.5),
  padding: theme.spacing(0.75, 2),
  textAlign: "center",
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  [theme.breakpoints.down("sm")]: {
    columnGap: theme.spacing(0.75),
    padding: theme.spacing(0.75, 1.25),
  },
}));

const StyledMessage = styled("span")({
  minWidth: 0,
});

const StyledCouch = styled("svg")(({ theme }) => ({
  height: 15,
  flexShrink: 0,
  fill: "var(--mui-palette-secondary-main)",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const StyledActions = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  gap: theme.spacing(1.25),
  paddingInlineStart: theme.spacing(1.25),
  borderInlineStart: "1px solid var(--mui-palette-divider)",
  whiteSpace: "nowrap",
  // Phones are the most likely to wrap, where a divider at the start of the second row would look stray
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(0.75),
    paddingInlineStart: 0,
    borderInlineStart: "none",
  },
}));

const StyledReplay = styled(ButtonBase)(({ theme }) => ({
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 0.25),
  borderRadius: theme.shape.borderRadius,
  color: "var(--mui-palette-text-secondary)",
  ...theme.typography.body2,
  fontWeight: 500,
  "&:hover": {
    color: "var(--mui-palette-text-primary)",
  },
}));

/** One-row box under the nav during the 100k week, with a link to the blog post, a replay and a donate button. */
export default function CelebrationBanner({ onReplay }: CelebrationBannerProps) {
  const { t } = useTranslation(DASHBOARD);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <StyledBanner>
      <StyledCouch viewBox="0 0 432 293" aria-hidden="true">
        {COUCHERS_LOGO_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </StyledCouch>
      <StyledMessage>
        <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
          {t("celebration_100k.banner_message")}
        </Typography>{" "}
        <StyledLink
          href={CELEBRATION_100K_BLOG_URL}
          variant="body2"
          underline="always"
          sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
        >
          {t("celebration_100k.banner_read_more_link")}
        </StyledLink>
      </StyledMessage>
      <StyledActions>
        <StyledReplay onClick={onReplay} aria-label={t("celebration_100k.banner_replay_button")}>
          <Replay fontSize="inherit" />
          {!isMobile && t("celebration_100k.banner_replay_button")}
        </StyledReplay>
        <Button
          variant="contained"
          size="small"
          disableElevation
          component={Link}
          href={CELEBRATION_100K_DONATE_URL}
          sx={{ minWidth: 0, py: 0.5, px: 1.25, borderRadius: 999, fontSize: "0.75rem", lineHeight: 1 }}
        >
          {t("celebration_100k.help_us_grow_button")}
        </Button>
      </StyledActions>
    </StyledBanner>
  );
}
