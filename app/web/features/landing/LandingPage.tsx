import {
  Box,
  Button as MuiButton,
  Container,
  ContainerProps,
  Divider,
  Grid,
  IconButton,
  Paper,
  styled,
  Typography,
  TypographyProps,
} from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { ExpandMoreIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import mobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import BasicForm from "features/auth/signup/BasicForm";
import { AUTH, GLOBAL, LANDING } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import vercelLogo from "resources/vercel.svg";
import { theme } from "theme";

import {
  blogRoute,
  loginRoute,
  signupRoute,
  tosRoute,
  volunteerRoute,
} from "../../routes";

const StyledSection = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(3),
  paddingBottom: 0,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1, 2),
  },
  background: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${mobileAuthBg.src}")`,
  backgroundPosition: "top center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  width: "100%",
  height: `calc(100vh - ${theme.shape.navPaddingXs})`,
  [theme.breakpoints.up("sm")]: {
    height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
  },
}));

const StyledContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
}));

const StyledVercelLink = styled("a")(({ theme }) => ({
  marginTop: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    position: "absolute",
    right: theme.spacing(2),
    bottom: theme.spacing(2),
    "& img": { height: "2.5rem" },
  },
  textAlign: "center",
  "& img": { height: "2rem" },
}));

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.common.white,
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "45%",
  maxWidth: theme.breakpoints.values.lg / 2,
  marginInlineEnd: "10%",
  gap: theme.spacing(2),
}));

const StyledIntroductionText = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderTop: `5px solid ${theme.palette.primary.main}`,
  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
  left: theme.spacing(1),
  position: "absolute",
  width: "100%",
}));

const StyledFormWrapper = styled("div")(({ theme }) => ({
  flexShrink: 0,
  backgroundColor: "#fff",
  borderRadius: theme.shape.borderRadius,
  [theme.breakpoints.up("md")]: {
    width: "45%",
    padding: theme.spacing(5, 8),
  },
  [theme.breakpoints.down("md")]: {
    width: "80%",
    padding: theme.spacing(5, 8),
    margin: theme.spacing(2, "auto"),
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    padding: theme.spacing(3, 4),
    margin: theme.spacing(0),
  },
}));

const StyledSpacer = styled("div")(({ theme }) => ({
  height: theme.spacing(4),
}));

const StyledHeader = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: "2rem",
  fontWeight: "bold",
  marginBottom: theme.spacing(3),
}));

const StyledParagraph = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledTopicLink = styled(Typography)<TypographyProps>(({ theme }) => ({
  textDecoration: "underline",
  paddingTop: theme.spacing(2),
}));

const StyledContainer = styled(Container)<ContainerProps>(({ theme }) => ({
  padding: theme.spacing(3),
  paddingTop: 0,
}));

const StyledGovernanceTile = styled(Paper)(({ theme }) => ({
  color: "#fff",
  height: "100%",
  padding: theme.spacing(3),
  margin: "auto",
  maxWidth: "80vw",
  backgroundColor: "#82bb42",
}));

const StyledDesignTile = styled(Paper)(({ theme }) => ({
  color: "#fff",
  height: "100%",
  padding: theme.spacing(3),
  margin: "auto",
  maxWidth: "80vw",
  backgroundColor: "#3da4ab",
}));

const StyledTechTile = styled(Paper)(({ theme }) => ({
  color: "#fff",
  height: "100%",
  padding: theme.spacing(3),
  margin: "auto",
  maxWidth: "80vw",
  backgroundColor: "#f46d50",
}));

export default function LandingPage() {
  const { t } = useTranslation([GLOBAL, LANDING, AUTH]);
  const { authState } = useAuthContext();
  const flowState = authState.flowState;

  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // This makes sure anything didn't get cleared up in the query cache in the Logout
  // component definitely gets cleared here when redirected to the landing page
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!authState.authenticated) {
      queryClient.clear();
    }
  }, [queryClient, authState.authenticated]);

  const moreContentRef = useRef<HTMLHeadingElement>(null);
  const scrollToMore = () => {
    moreContentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <>
      <HtmlMeta />
      <StyledSection>
        <StyledContent>
          <StyledIntroduction>
            <StyledIntroductionText>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  [theme.breakpoints.up("md")]: {
                    fontSize: "2rem",
                    lineHeight: "1.15",
                    textAlign: "left",
                  },
                }}
              >
                {t("landing:introduction_title")}
              </Typography>
              <Typography
                variant="h2"
                component="span"
                sx={{
                  [theme.breakpoints.up("md")]: {
                    display: "inline-block",
                    marginTop: theme.spacing(4),
                    position: "relative",
                  },
                }}
              >
                {t("landing:introduction_subtitle")}
                <StyledDivider />
              </Typography>
            </StyledIntroductionText>
            <Box
              display={{ xs: "none", md: "flex" }}
              flexDirection="column"
              width="100%"
              mt={2}
            >
              <MuiButton
                onClick={scrollToMore}
                variant="text"
                size="medium"
                sx={{
                  "&.MuiButtonBase-root:hover": {
                    bgcolor: "transparent",
                  },
                  color: theme.palette.common.white,
                }}
              >
                {t("global:read_more")}
              </MuiButton>
              <IconButton
                onClick={scrollToMore}
                size="small"
                sx={{
                  "&.MuiButtonBase-root:hover": {
                    bgcolor: "transparent",
                  },
                  color: theme.palette.common.white,
                }}
              >
                <ExpandMoreIcon fontSize="large" />
              </IconButton>
            </Box>
          </StyledIntroduction>
          <StyledFormWrapper>
            <Typography variant="h2" component="h3">
              {t("landing:signup_header")}
            </Typography>
            <Typography variant="body2" paragraph gutterBottom>
              {t("landing:signup_description", { user_count: "40k" })}
            </Typography>
            {!flowState || !isMounted ? (
              <BasicForm
                submitText={t("landing:create_an_account")}
                successCallback={() => router.push(signupRoute)}
              />
            ) : (
              <Link href={signupRoute} passHref legacyBehavior>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ margin: theme.spacing(4, 0) }}
                >
                  {t("landing:signup_continue")}
                </Button>
              </Link>
            )}
            <Typography gutterBottom>
              <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
                Already have an account?{" "}
                <StyledLink href={loginRoute}>Log in</StyledLink>
              </Trans>
            </Typography>
            <Typography variant="caption" gutterBottom>
              <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
                By continuing, you agree to our{" "}
                <StyledLink href={tosRoute} target="_blank" variant="caption">
                  Terms of Service
                </StyledLink>
                , including our cookie, email, and data handling policies.
              </Trans>
            </Typography>
          </StyledFormWrapper>
          <Box
            display={{ xs: "flex", md: "none" }}
            flexDirection="column"
            width="100%"
            mt={2}
          >
            <MuiButton
              onClick={scrollToMore}
              variant="text"
              sx={{
                color: theme.palette.common.white,
                "&.MuiButtonBase-root:hover": {
                  bgcolor: "transparent",
                },
              }}
              disableRipple
            >
              {t("global:read_more")}
            </MuiButton>
            <IconButton
              onClick={scrollToMore}
              size="small"
              sx={{
                color: theme.palette.common.white,
                "&.MuiButtonBase-root:hover": {
                  bgcolor: "transparent",
                },
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </StyledContent>
        {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
          <StyledVercelLink
            rel="noopener noreferrer"
            href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
          >
            <img alt="Powered by Vercel" src={vercelLogo.src} />
          </StyledVercelLink>
        )}
      </StyledSection>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        <StyledHeader component="h2" ref={moreContentRef}>
          Like Couchsurfing™, but better
        </StyledHeader>
        <StyledParagraph>
          Couchers.org is a <strong>non-profit and free</strong> platform,{" "}
          <strong>built by volunteers</strong> and responsible to the couch
          surfing community, instead of investors. Formed after
          Couchsurfing&#8482; put up its paywall in 2020, our goal is to{" "}
          <strong>reclaim couch surfing</strong> by creating a{" "}
          <strong>complete alternative</strong>, with all your{" "}
          <strong>favourite features</strong>.
        </StyledParagraph>
        <StyledParagraph>
          Couchers.org is the <strong>fastest growing</strong> couch surfing
          platform. We have built the{" "}
          <strong>largest active volunteer base </strong> with over 40 skilled
          contributors. Our product teams are designing and developing the
          platform at blazing speed, releasing{" "}
          <strong>new features every two weeks</strong>; our community teams are
          planning out and executing user base growth and engagement strategies
          to reach a <strong>critical mass of quality couch surfers</strong>{" "}
          with active local communities and a vibrant global discussion.
        </StyledParagraph>
        <StyledParagraph>
          <Link href={volunteerRoute} passHref legacyBehavior>
            <Button
              variant="contained"
              color="secondary"
              sx={{ marginRight: theme.spacing(2) }}
            >
              Join our team
            </Button>
          </Link>
          <Link href={volunteerRoute} passHref legacyBehavior>
            <Button sx={{ marginRight: theme.spacing(2) }}>Volunteer</Button>
          </Link>
        </StyledParagraph>
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        <StyledHeader component="h2">
          Our plan: fix the problems with Couchsurfing™
        </StyledHeader>
        <StyledParagraph>
          We're sure that you, like all of us, have had great experiences that
          couldn't have happened without Couchsurfing™. But we all know it's
          got its issues. For the next generation in couch surfing apps, we need
          to fix those issues.
        </StyledParagraph>
        <StyledParagraph>
          If there's any problems you've found with Couchsurfing™ or any other
          platforms, we'd love to hear about it so we can try to fix them.
        </StyledParagraph>
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        <StyledHeader component="h2">
          The problems with Couchsurfing™
        </StyledHeader>
      </Container>
      <StyledContainer component="section" maxWidth="lg">
        <Grid container gap={3} justifyContent="center" alignItems="stretch">
          <Grid item xs={12} md={4}>
            <StyledGovernanceTile>
              <Typography variant="subtitle1">Issue:</Typography>
              <StyledHeader variant="h1" component="h3">
                Governance
              </StyledHeader>
              <StyledTopicLink variant="h2" component="h3">
                <Link href="/issues/profit-and-incentives">
                  Profit incentives
                </Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Couchsurfing&#8482; is explicitly for-profit, prioritizing
                returns for investors over users and communities.
              </Typography>

              <StyledTopicLink variant="h2" component="h3">
                <Link href="/issues/communities-and-trust">
                  Neglected communities
                </Link>
              </StyledTopicLink>
              <Typography variant="body1">
                The community has been ignored, too many users have been pushed
                onto the platform, trust between members has been eroded.
              </Typography>
            </StyledGovernanceTile>
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledDesignTile>
              <Typography variant="subtitle1">Issue:</Typography>
              <StyledHeader variant="h1" component="h3">
                Design
              </StyledHeader>
              <StyledTopicLink variant="h2" component="h3">
                <Link href="/issues/creeps-and-freeloaders">Safety</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Detrimental users threaten users' safety, especially for women.
                Freeloaders abound.
              </Typography>

              <StyledTopicLink variant="h2" component="h3">
                <Link href="/issues/reviews">Reference system</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                You can't trust people based on references.
              </Typography>

              <StyledTopicLink variant="h2" component="h3">
                <Link href="/issues/host-matching">Super-host effect</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Local communities have been shrinking to just small groups of
                super-hosts.
              </Typography>
            </StyledDesignTile>
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTechTile>
              <Typography variant="subtitle1">Issue:</Typography>
              <StyledHeader variant="h1" component="h3">
                Technology
              </StyledHeader>
              <StyledTopicLink variant="h2" component="h3">
                <Link href="/issues/the-build">The bugs and app issues</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                There are far too many bugs and problems with the
                Couchsurfing&#8482; platform. It wasn't good enough as a free
                service, and it's definitely not good enough now that it's paid.
              </Typography>
            </StyledTechTile>
          </Grid>
        </Grid>
      </StyledContainer>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        <StyledHeader component="h2">
          Our plan for the next-generation couch surfing platform
        </StyledHeader>
      </Container>
      <StyledContainer component="section" maxWidth="lg">
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          <Grid item xs={12} md={4}>
            <StyledGovernanceTile>
              <StyledHeader variant="subtitle1">Our plan:</StyledHeader>
              <StyledHeader variant="h1" component="h3">
                Governance
              </StyledHeader>
              <StyledTopicLink variant="h2" component="h3">
                <Link href="/plan/profit-and-incentives">
                  Non-profit structure
                </Link>
              </StyledTopicLink>
              <Typography variant="body1">
                This platform will be run as a non-profit, taking no outside
                investment. The priorities will be the users and community.
              </Typography>

              <StyledTopicLink variant="h2" component="h3">
                <Link href="/plan/communities-and-trust">
                  Community-first framework
                </Link>
              </StyledTopicLink>
              <Typography variant="body1">
                We will build communities into the foundations of the product,
                and improve trust through a new verification method.
              </Typography>
            </StyledGovernanceTile>
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledDesignTile>
              <Typography variant="subtitle1">Our plan:</Typography>
              <StyledHeader variant="h1" component="h3">
                Design
              </StyledHeader>
              <StyledTopicLink variant="h2" component="h3">
                <Link href="/plan/creeps-and-freeloaders">
                  Member accountability
                </Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Users will be accountable for how they treat other members,
                filtering out creeps and freeloaders.
              </Typography>

              <StyledTopicLink variant="h2" component="h3">
                <Link href="/plan/reviews">Improved review system</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Overhauled references to reflect more accurately on users.
              </Typography>

              <StyledTopicLink variant="h2" component="h3">
                <Link href="/plan/host-matching">Better host finding</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Healthier communities by spreading out hosting opportunities and
                no message limits.
              </Typography>
            </StyledDesignTile>
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTechTile>
              <Typography variant="subtitle1">Our plan:</Typography>
              <StyledHeader variant="h1" component="h3">
                Technology
              </StyledHeader>
              <StyledTopicLink variant="h2" component="h3">
                <Link href="/plan/the-build">Build it right</Link>
              </StyledTopicLink>
              <Typography variant="body1">
                Our platform is developer-led. We will build this right, make it
                scalable, and listen to the community to fix bugs. We want to
                make something to be proud of.
              </Typography>
            </StyledTechTile>
          </Grid>
        </Grid>
      </StyledContainer>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        <StyledParagraph>
          Read more about Couchers.org on our{" "}
          <StyledLink href={blogRoute}>Blog</StyledLink>.
        </StyledParagraph>
      </Container>
    </>
  );
}
