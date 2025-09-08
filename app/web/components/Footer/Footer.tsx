import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import RedditIcon from "@mui/icons-material/Reddit";
import {
  Button,
  ButtonProps,
  Link as MuiLink,
  Typography,
  styled,
} from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";

import { BlueSkyIcon } from "@/components/Icons";
import ReportButton from "@/components/Navigation/ReportButton";
import StyledLink from "@/components/StyledLink";
import AntibotNote from "@/features/antibot/AntibotNote";
import { Trans, useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import {
  BLOG_ROUTE,
  BUILT_WITH_ROUTE,
  CONTACT_ROUTE,
  DONATIONS_ROUTE,
  EVENTS_ROUTE,
  FACEBOOK_URL,
  FAQ_ROUTE,
  FOUNDATION_ROUTE,
  GITHUB_UPDATES_URL,
  GITHUB_URL,
  HELP_CENTER_URL,
  INSTAGRAM_URL,
  LANDING_ROUTE,
  MISSION_ROUTE,
  NEWSLETTER_SIGNUP_URL,
  PLAN_ROUTE,
  REDDIT_URL,
  ROADMAP_ROUTE,
  TEAM_ROUTE,
  TOS_ROUTE,
  VOLUNTEER_ROUTE,
} from "@/routes";
import { theme } from "@/theme";
import { timeAgoI18n } from "@/utils/timeAgo";

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
  backgroundColor: theme.palette.background.paper,
}));

const StyledUpperContainer = styled("div")(({ theme }) => ({
  width: "100%",
  display: "grid",
  rowGap: theme.spacing(1),
  columnGap: theme.spacing(1),
  gridTemplateColumns: "auto auto",
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
  backgroundColor: theme.palette.background.paper,
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
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.getContrastText(theme.palette.primary.main),
}));

const StyledLowerContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  margin: "0 auto",
  justifyContent: "center",
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),

  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },
  "& > * + *::before": {
    content: "'|'",
    marginInlineEnd: theme.spacing(2),
  },
}));

const StyledButtonContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  justifySelf: "flex-start",
});

const StyledSocialIconsContainer = styled("div")({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  gap: "12px",
  marginTop: "16px",
});

const StyledButton = styled(Button)<ButtonProps>(() => ({
  minWidth: "8rem",
  textAlign: "center",
  marginBlockEnd: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    minWidth: "12rem",
  },
  "& .MuiButton-label > * + *": {
    marginInlineStart: theme.spacing(1),
  },
}));

const VersionLink = styled(Link)(() => ({
  fontWeight: 700,
}));

const Footer = ({ bottomMargin }: { bottomMargin?: string }) => {
  const { t } = useTranslation(GLOBAL);

  const versionText = Config.displayVersion;
  const versionLink = ROADMAP_ROUTE;
  const updatedAgoText = Config.commitTimestamp
    ? timeAgoI18n({
        input: Config.commitTimestamp,
        t: t,
      })
    : "unknown";
  const updateAgoLink = GITHUB_UPDATES_URL;

  return (
    <StyledFooter bottomMargin={bottomMargin}>
      <StyledUpperOuterContainer>
        <StyledUpperContainer>
          <div>
            <Typography variant="h4" component="h4">
              {t("nav.about")}
            </Typography>
            <FooterLink href={PLAN_ROUTE}>{t("nav.our_plan")}</FooterLink>
            <FooterLink href={FAQ_ROUTE}>{t("nav.faq")}</FooterLink>
            <FooterLink href={MISSION_ROUTE}>{t("nav.mission")}</FooterLink>
            <FooterLink href={HELP_CENTER_URL}>
              {t("nav.help_center")}
            </FooterLink>
            <FooterLink href={ROADMAP_ROUTE}>
              {t("nav.roadmap_updates")}
            </FooterLink>
          </div>
          <div>
            <Typography variant="h4" component="h4">
              {t("nav.community")}
            </Typography>
            <FooterLink href={BLOG_ROUTE}>{t("nav.blog")}</FooterLink>
            <FooterLink href={TEAM_ROUTE}>{t("nav.our_team")}</FooterLink>
            <FooterLink href={LANDING_ROUTE}>
              {t("nav.landing_page")}
            </FooterLink>
            <FooterLink href={EVENTS_ROUTE}>
              {t("nav.show_all_events")}
            </FooterLink>
            <FooterLink href={NEWSLETTER_SIGNUP_URL}>
              {t("nav.newsletter")}
            </FooterLink>
          </div>
          <div>
            <Typography variant="h4" component="h4">
              {t("nav.legal_more")}
            </Typography>
            <FooterLink href={TOS_ROUTE}>{t("terms_of_service")}</FooterLink>
            <FooterLink href={FOUNDATION_ROUTE}>{t("legal_name")}</FooterLink>
            <FooterLink href={BUILT_WITH_ROUTE}>
              {t("nav.built_with")}
            </FooterLink>
            <FooterLink href={CONTACT_ROUTE}>{t("nav.contact_us")}</FooterLink>
            <ReportButton isMenuLink />
          </div>
          <StyledButtonContainer>
            <StyledButton
              component={Link}
              href={DONATIONS_ROUTE}
              variant="contained"
            >
              {t("nav.donate")}
            </StyledButton>
            <StyledButton
              component={Link}
              href={VOLUNTEER_ROUTE}
              variant="contained"
              color="secondary"
            >
              {t("nav.volunteer")}
            </StyledButton>
            <StyledSocialIconsContainer>
              <MuiLink
                href={GITHUB_URL}
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                color="inherit"
              >
                <GitHubIcon />
              </MuiLink>
              <MuiLink
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
                color="inherit"
              >
                <InstagramIcon />
              </MuiLink>
              <MuiLink
                href={REDDIT_URL}
                target="_blank"
                rel="noopener"
                aria-label="Reddit"
                color="inherit"
              >
                <RedditIcon />
              </MuiLink>
              <MuiLink
                href="https://bsky.app/profile/couchers.bsky.social"
                target="_blank"
                rel="noopener"
                aria-label="BlueSky"
                color="inherit"
              >
                <BlueSkyIcon />
              </MuiLink>
              <MuiLink
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener"
                aria-label="Facebook"
                color="inherit"
              >
                <FacebookIcon />
              </MuiLink>
            </StyledSocialIconsContainer>
          </StyledButtonContainer>
        </StyledUpperContainer>
      </StyledUpperOuterContainer>
      <StyledMiddleOuterContainer>
        <StyledMiddleContainer>
          <Typography variant="body2">
            <StyledLink href={FOUNDATION_ROUTE}>
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
          <Typography variant="body1">{t("footer.copyright")}</Typography>
          <Typography variant="body1">
            <Trans
              t={t}
              i18nKey="footer.version_info"
              values={{
                version: versionText,
                updated_ago: updatedAgoText,
              }}
            >
              Version{" "}
              <VersionLink href={versionLink}>{versionText}</VersionLink>, last
              updated{" "}
              <VersionLink href={updateAgoLink}>{updatedAgoText}</VersionLink>.
            </Trans>
          </Typography>
        </StyledLowerContainer>
      </StyledLowerOuterContainer>
    </StyledFooter>
  );
};

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => {
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
};

export default Footer;
