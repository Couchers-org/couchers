import {
  Button,
  ButtonProps,
  Link as MuiLink,
  styled,
  Typography,
} from "@mui/material";
import { COPYRIGHT, NON_PROFIT } from "components/Footer/constants";
import { GithubIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { ReactNode } from "react";
import {
  blogRoute,
  builtWithRoute,
  contactRoute,
  donationsRoute,
  eventsRoute,
  faqRoute,
  forumURL,
  foundationRoute,
  githubURL,
  helpCenterURL,
  missionRoute,
  planRoute,
  teamRoute,
  tosRoute,
  volunteerRoute,
} from "routes";
import { theme } from "theme";

const StyledFooter = styled("footer")({
  display: "flex",
  flexDirection: "column",
  width: "100%",
});

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

export default function Footer() {
  const { t } = useTranslation(GLOBAL);

  return (
    <StyledFooter>
      <StyledUpperOuterContainer>
        <StyledUpperContainer>
          <div>
            <Typography variant="h3" component="h2">
              {t("nav.about")}
            </Typography>
            <FooterLink href={planRoute}>{t("nav.our_plan")}</FooterLink>
            <FooterLink href={faqRoute}>{t("nav.faq")}</FooterLink>
            <FooterLink href={missionRoute}>{t("nav.mission")}</FooterLink>
            <FooterLink href={helpCenterURL}>{t("nav.help_center")}</FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {t("nav.community")}
            </Typography>
            <FooterLink href={forumURL}>{t("nav.forum")}</FooterLink>
            <FooterLink href={blogRoute}>{t("nav.blog")}</FooterLink>
            <FooterLink href={teamRoute}>{t("nav.our_team")}</FooterLink>
            <FooterLink href={eventsRoute}>
              {t("nav.show_all_events")}
            </FooterLink>
          </div>
          <div>
            <Typography variant="h3" component="h2">
              {t("nav.legal_more")}
            </Typography>
            <FooterLink href={tosRoute}>{t("terms_of_service")}</FooterLink>
            <FooterLink href={foundationRoute}>{t("legal_name")}</FooterLink>
            <FooterLink href={builtWithRoute}>{t("nav.built_with")}</FooterLink>
            <FooterLink href={contactRoute}>{t("nav.contact_us")}</FooterLink>
          </div>
          <StyledButtonContainer>
            <Link href={donationsRoute} passHref>
              <StyledButton component="a" variant="contained">
                {t("nav.donate")}
              </StyledButton>
            </Link>
            <Link href={volunteerRoute} passHref>
              <StyledButton component="a" variant="contained" color="secondary">
                {t("nav.volunteer")}
              </StyledButton>
            </Link>
            <StyledButton
              component="a"
              href={githubURL}
              variant="outlined"
              color="primary"
              sx={{
                color: theme.palette.common.black,
                borderColor: theme.palette.grey[300],

                "&:hover": {
                  borderColor: theme.palette.grey[300],
                  backgroundColor: "#3135390A",
                },
              }}
            >
              <GithubIcon />
              <span>{t("nav.github")}</span>
            </StyledButton>
            {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
              <StyledButton
                component="a"
                href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
                variant="outlined"
                color="primary"
                sx={{
                  color: theme.palette.common.black,
                  borderColor: theme.palette.grey[300],

                  "&:hover": {
                    borderColor: theme.palette.grey[300],
                    backgroundColor: "#3135390A",
                  },
                }}
              >
                Powered by ▲
              </StyledButton>
            )}
          </StyledButtonContainer>
        </StyledUpperContainer>
      </StyledUpperOuterContainer>
      <StyledMiddleOuterContainer>
        <StyledMiddleContainer>
          <Typography variant="body2">
            <Link href={foundationRoute} passHref>
              <a>{NON_PROFIT}</a>
            </Link>
          </Typography>
        </StyledMiddleContainer>
      </StyledMiddleOuterContainer>
      <StyledLowerOuterContainer>
        <StyledLowerContainer>
          <Typography variant="body1">{COPYRIGHT}</Typography>
          <Typography variant="body1">
            It&apos;s like Couchsurfing&#8482;, but better.
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
