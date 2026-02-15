import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import RedditIcon from "@mui/icons-material/Reddit";
import {
  Button,
  ButtonProps,
  Link as MuiLink,
  styled,
  Typography,
} from "@mui/material";
import { BlueSkyIcon } from "components/Icons";
import ReportButton from "components/Navigation/ReportButton";
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
  donationsRoute,
  eventsRoute,
  facebookURL,
  faqRoute,
  foundationRoute,
  githubUpdatesURL,
  githubURL,
  helpCenterURL,
  instagramURL,
  landingRoute,
  missionRoute,
  newsletterSignupURL,
  planRoute,
  redditURL,
  roadmapRoute,
  shopRoute,
  teamRoute,
  tosRoute,
  volunteerRoute,
} from "routes";
import { timeAgoI18n } from "utils/timeAgo";

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
  color: theme.palette.primary.contrastText,
}));

const StyledLowerContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  margin: "0 auto",
  maxWidth: theme.breakpoints.values.md,
  paddingInlineStart: theme.spacing(4),
  paddingInlineEnd: theme.spacing(4),

  [theme.breakpoints.up("sm")]: {
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
});

const StyledSocialIconsContainer = styled("div")({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  gap: "12px",
  marginTop: "16px",
});

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
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

const VersionLink = styled(Link)(({ theme }) => ({
  fontWeight: 700,
  color: "inherit",
}));

export default function Footer({ bottomMargin }: { bottomMargin?: string }) {
  const { t } = useTranslation(GLOBAL);

  const version_text = process.env.NEXT_PUBLIC_DISPLAY_VERSION || "dev";
  const version_link = roadmapRoute;
  const updated_ago_text = process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP
    ? timeAgoI18n({
        input: new Date(process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP),
        t: t,
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
            <StyledButton
              component={Link}
              href={donationsRoute}
              variant="contained"
            >
              {t("nav.donate")}
            </StyledButton>
            <StyledButton
              component={Link}
              href={volunteerRoute}
              variant="contained"
              color="secondary"
            >
              {t("nav.volunteer")}
            </StyledButton>
            <StyledSocialIconsContainer>
              <MuiLink
                href={githubURL}
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                color="inherit"
              >
                <GitHubIcon />
              </MuiLink>
              <MuiLink
                href={instagramURL}
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
                color="inherit"
              >
                <InstagramIcon />
              </MuiLink>
              <MuiLink
                href={redditURL}
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
                href={facebookURL}
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
