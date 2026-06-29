import {
  Box,
  Button,
  ButtonProps,
  Link as MuiLink,
  styled,
  Typography,
} from "@mui/material";
import ReportButton from "components/Navigation/ReportButton";
import SocialMediaLinks from "components/SocialMediaLinks";
import StyledLink from "components/StyledLink";
import AntibotNote from "features/antibot/AntibotNote";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { ReactNode } from "react";
import {
  blogRoute,
  builtWithRoute,
  contactRoute,
  couchersAppStoreURL,
  couchersGooglePlayURL,
  donationsRoute,
  eventsRoute,
  faqRoute,
  foundationRoute,
  githubUpdatesURL,
  helpCenterURL,
  landingRoute,
  missionRoute,
  newsletterSignupURL,
  planRoute,
  pressRoute,
  roadmapRoute,
  shopRoute,
  teamRoute,
  tosRoute,
  volunteerRoute,
} from "routes";
import { useIsNativeEmbed } from "utils/nativeLink";
import { timeAgo } from "utils/timeAgo";

const StyledFooter = styled("footer")<{ bottomMargin?: string }>(
  ({ bottomMargin }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginBottom: bottomMargin,
  }),
);

const StyledUpperOuterContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginBlockStart: theme.spacing(2),
  paddingBlockStart: theme.spacing(3),
  paddingBlockEnd: theme.spacing(3),
  borderTop: `solid 1px ${theme.palette.divider}`,
}));

const StyledUpperContainer = styled("div")(({ theme }) => ({
  width: "100%",
  display: "grid",
  rowGap: theme.spacing(1),
  columnGap: theme.spacing(1),
  gridTemplateColumns: "1fr 1fr",
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),

  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(4, auto)",
    justifyItems: "center",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(4, auto)",
    justifyContent: "center",
    columnGap: theme.spacing(8),
  },
}));

const StyledMiddleOuterContainer = styled("div")(({ theme }) => ({
  paddingBlockEnd: theme.spacing(2),
}));

const StyledMiddleContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  margin: "0 auto",
  justifyContent: "center",
  fontStyle: "italic",
  color: theme.palette.grey[500],
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),
}));

const StyledLowerOuterContainer = styled("div")(({ theme }) => ({
  paddingBlockStart: theme.spacing(2),
  paddingBlockEnd: theme.spacing(2),
  backgroundColor: "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
}));

const StyledLowerContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  margin: "0 auto",
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),

  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    justifyContent: "center",

    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
    "& > * + *::before": {
      content: "'|'",
      marginInlineEnd: theme.spacing(2),
    },
  },
}));

const StyledButtonContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  justifySelf: "flex-start",
  alignItems: "center",
  width: "100%",
});

const StyledSocialIconsContainer = styled("div")({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  gap: 2,
  marginTop: "16px",
});

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  minWidth: "8rem",
  textAlign: "center",
  marginBlockEnd: theme.spacing(2),
  width: "100%",
  "& .MuiButton-label > * + *": {
    marginInlineStart: theme.spacing(1),
  },
}));

const VersionLink = styled(Link)({
  fontWeight: 700,
  color: "inherit",
});

export default function Footer({ bottomMargin }: { bottomMargin?: string }) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(GLOBAL);
  const isNativeEmbed = useIsNativeEmbed();

  const version_text = process.env.NEXT_PUBLIC_DISPLAY_VERSION || "dev";
  const version_link = roadmapRoute;
  const updated_ago_text = process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP
    ? timeAgo({
        since: new Date(process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP),
        t,
        locale,
      })
    : "unknown";
  const updated_ago_link = githubUpdatesURL;

  return (
    <StyledFooter bottomMargin={bottomMargin}>
      <StyledUpperOuterContainer>
        <StyledUpperContainer>
          <div>
            <Typography variant="h4" component="h4">
              {t("nav.about")}
            </Typography>
            <FooterLink href={planRoute}>{t("nav.our_plan")}</FooterLink>
            <FooterLink href={faqRoute}>{t("nav.faq")}</FooterLink>
            <FooterLink href={missionRoute}>{t("nav.mission")}</FooterLink>
            <FooterLink href={helpCenterURL}>{t("nav.help_center")}</FooterLink>
            <FooterLink href={roadmapRoute}>
              {t("nav.roadmap_updates")}
            </FooterLink>
            <FooterLink href={pressRoute}>{t("nav.press")}</FooterLink>
          </div>
          <div>
            <Typography variant="h4" component="h4">
              {t("nav.community")}
            </Typography>
            <FooterLink href={blogRoute}>{t("nav.blog")}</FooterLink>
            <FooterLink href={teamRoute}>{t("nav.our_team")}</FooterLink>
            <FooterLink href={landingRoute}>{t("nav.landing_page")}</FooterLink>
            <FooterLink href={eventsRoute}>
              {t("nav.show_all_events")}
            </FooterLink>
            <FooterLink href={newsletterSignupURL}>
              {t("nav.newsletter")}
            </FooterLink>
            <FooterLink href={shopRoute}>{t("nav.merch_shop")}</FooterLink>
          </div>
          <div>
            <Typography variant="h4" component="h4">
              {t("nav.legal_more")}
            </Typography>
            <FooterLink href={tosRoute}>{t("terms_of_service")}</FooterLink>
            <FooterLink href={foundationRoute}>{t("legal_name")}</FooterLink>
            <FooterLink href={builtWithRoute}>{t("nav.built_with")}</FooterLink>
            <FooterLink href={contactRoute}>{t("nav.contact_us")}</FooterLink>
            <ReportButton isMenuLink />
          </div>
          <StyledButtonContainer>
            {!isNativeEmbed && (
              <StyledButton
                component={Link}
                href={donationsRoute}
                variant="contained"
              >
                {t("nav.donate")}
              </StyledButton>
            )}
            <StyledButton
              component={Link}
              href={volunteerRoute}
              variant="contained"
              color="secondary"
            >
              {t("nav.volunteer")}
            </StyledButton>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                flexWrap: "wrap",
                gap: 1,
                mb: 1,
              }}
            >
              <a
                href={couchersAppStoreURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/img/app-store-badge/${locale}.svg`}
                  alt={t("app_store_badge_a11y")}
                  style={{ height: "26px", width: "auto", display: "block" }}
                />
              </a>
              <a
                href={couchersGooglePlayURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/img/google-play-badge/${locale}.svg`}
                  alt={t("google_play_badge_a11y")}
                  style={{ height: "26px", width: "auto", display: "block" }}
                />
              </a>
            </Box>
            <StyledSocialIconsContainer>
              <SocialMediaLinks iconSize="1.5rem" />
            </StyledSocialIconsContainer>
          </StyledButtonContainer>
        </StyledUpperContainer>
      </StyledUpperOuterContainer>
      <StyledMiddleOuterContainer>
        <StyledMiddleContainer>
          <Typography variant="body2">
            <StyledLink href={foundationRoute}>
              {t("footer.non_profit_note")}
            </StyledLink>
          </Typography>
          <Typography variant="body2" sx={{ fontSize: ".6em" }}>
            <AntibotNote />
          </Typography>
        </StyledMiddleContainer>
      </StyledMiddleOuterContainer>
      <StyledLowerOuterContainer>
        <StyledLowerContainer>
          <Typography variant="body1">© 2026 Couchers, Inc.</Typography>
          <Typography variant="body1">
            <Trans
              t={t}
              i18nKey="footer.version_info"
              values={{
                version: version_text,
                updated_ago: updated_ago_text,
              }}
            >
              Version{" "}
              <VersionLink
                href={version_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {version_text}
              </VersionLink>
              , last updated{" "}
              <VersionLink
                href={updated_ago_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {updated_ago_text}
              </VersionLink>
              .
            </Trans>
          </Typography>
        </StyledLowerContainer>
      </StyledLowerOuterContainer>
    </StyledFooter>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <Typography variant="body1">
        <MuiLink
          href={href}
          color="textSecondary"
          target="_blank"
          rel="noopener"
          underline="hover"
        >
          {children}
        </MuiLink>
      </Typography>
    );
  }
  return (
    <Typography variant="body1">
      <StyledLink href={href} color="textSecondary">
        {children}
      </StyledLink>
    </Typography>
  );
}
