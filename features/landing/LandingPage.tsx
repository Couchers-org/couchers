import {
  Button as MuiButton,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { ExpandMoreIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import BasicForm from "features/auth/signup/BasicForm";
import useAuthStyles from "features/auth/useAuthStyles";
import { AUTH, GLOBAL, LANDING } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import vercelLogo from "resources/vercel.svg";
import makeStyles from "utils/makeStyles";

import {
  blogRoute,
  forumURL,
  loginRoute,
  signupRoute,
  tosRoute,
  volunteerRoute,
} from "../../routes";

const useStyles = makeStyles((theme) => ({
  scrollMoreButton: {
    color: theme.palette.common.white,
    background: "none",
    border: "none",
  },
  spacer: {
    height: theme.spacing(4),
  },
  topSection: {
    padding: theme.spacing(3),
  },
  header: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: theme.spacing(3),
  },
  para: {
    marginBottom: theme.spacing(2),
  },
  subNavButtons: {
    marginRight: theme.spacing(2),
  },
  continueButton: {
    margin: theme.spacing(4, 0),
  },
  tileSection: {
    padding: theme.spacing(3),
    paddingTop: 0,
  },
  tile: {
    color: "#fff",
    height: "100%",
    padding: theme.spacing(3),
    margin: "auto",
    maxWidth: "80vw",
  },
  governanceTile: {
    backgroundColor: "#82bb42",
  },
  designTile: {
    backgroundColor: "#3da4ab",
  },
  techTile: {
    backgroundColor: "#f46d50",
  },
  topicLink: {
    textDecoration: "underline",
    paddingTop: theme.spacing(2),
  },
}));

export default function LandingPage() {
  const { t } = useTranslation([GLOBAL, LANDING, AUTH]);
  const { authState } = useAuthContext();
  const flowState = authState.flowState;

  const router = useRouter();

  const authClasses = useAuthStyles();
  const classes = useStyles();

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
    console.log(moreContentRef.current);
    moreContentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <>
      <HtmlMeta />
      <section
        className={classNames(
          classes.topSection,
          authClasses.page,
          authClasses.pageBackground
        )}
      >
        <div className={authClasses.content}>
          <div className={authClasses.introduction}>
            <Typography
              classes={{ root: authClasses.title }}
              variant="h1"
              component="h1"
            >
              {t("landing:introduction_title")}
            </Typography>
            <Typography
              classes={{ root: authClasses.subtitle }}
              variant="h2"
              component="span"
            >
              {t("landing:introduction_subtitle")}
              <Divider className={authClasses.underline}></Divider>
            </Typography>
          </div>
          <div className={authClasses.formWrapper}>
            <Typography variant="h2" component="h3">
              {t("landing:signup_header")}
            </Typography>
            <Typography variant="body2" paragraph gutterBottom>
              {t("landing:signup_description", { user_count: "12k" })}
            </Typography>
            {!flowState || !isMounted ? (
              <BasicForm
                submitText={t("landing:create_an_account")}
                successCallback={() => router.push(signupRoute)}
              />
            ) : (
              <Link href={signupRoute} passHref>
                <Button
                  variant="contained"
                  color="secondary"
                  className={classes.continueButton}
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
          </div>
        </div>
        {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
          <a
            className={authClasses.vercelLink}
            rel="noopener noreferrer"
            href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
          >
            <img alt="Powered by Vercel" src={vercelLogo.src} />
          </a>
        )}
        <MuiButton
          className={classes.scrollMoreButton}
          onClick={scrollToMore}
          variant="text"
        >
          Read more
        </MuiButton>
        <IconButton
          className={classes.scrollMoreButton}
          onClick={scrollToMore}
          size="small"
        >
          <ExpandMoreIcon />
        </IconButton>
      </section>
      <div className={classes.spacer} />
      <Container component="section" maxWidth="md">
        <Typography
          component="h2"
          className={classes.header}
          ref={moreContentRef}
        >
          Like Couchsurfing™, but better
        </Typography>
        <Typography className={classes.para}>
          Couchers.org is a <strong>non-profit and free</strong> platform,{" "}
          <strong>built by volunteers</strong> and responsible to the couch
          surfing community, instead of investors. Formed after
          Couchsurfing&#8482; put up its paywall in 2020, our goal is to{" "}
          <strong>reclaim couch surfing</strong> by creating a{" "}
          <strong>complete alternative</strong>, with all your{" "}
          <strong>favourite features</strong>.
        </Typography>
        <Typography className={classes.para}>
          Couchers.org is the <strong>fastest growing</strong> couch surfing
          platform. We have built the{" "}
          <strong>largest active volunteer base </strong> with over 40 skilled
          contributors. Our product teams are designing and developing the
          platform at blazing speed, releasing{" "}
          <strong>new features every two weeks</strong>; our community teams are
          planning out and executing user base growth and engagement strategies
          to reach a <strong>critical mass of quality couch surfers</strong>{" "}
          with active local communities and a vibrant global discussion.
        </Typography>
        <Typography className={classes.para}>
          <Link href={volunteerRoute} passHref>
            <Button
              variant="contained"
              color="secondary"
              className={classes.subNavButtons}
            >
              Join our team
            </Button>
          </Link>
          <Link href={volunteerRoute} passHref>
            <Button className={classes.subNavButtons}>Volunteer</Button>
          </Link>
        </Typography>
      </Container>
      <div className={classes.spacer} />
      <Container component="section" maxWidth="md">
        <Typography component="h2" className={classes.header}>
          Our plan: fix the problems with Couchsurfing™
        </Typography>
        <Typography className={classes.para}>
          We're sure that you, like all of us, have had great experiences that
          couldn't have happened without Couchsurfing™. But we all know it's got
          its issues. For the next generation in couch surfing apps, we need to
          fix those issues.
        </Typography>
        <Typography className={classes.para}>
          If there's any problems you've found with Couchsurfing™ or any other
          platforms, we'd love to hear about it so we can try to fix them.
        </Typography>
        <Typography className={classes.para}>
          <Link href={forumURL} passHref>
            <Button
              variant="contained"
              color="secondary"
              className={classes.subNavButtons}
            >
              Tell us what you think
            </Button>
          </Link>
        </Typography>
      </Container>
      <div className={classes.spacer} />
      <Container component="section" maxWidth="md">
        <Typography component="h2" className={classes.header}>
          The problems with Couchsurfing™
        </Typography>
      </Container>
      <Container
        component="section"
        maxWidth="lg"
        className={classes.tileSection}
      >
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          <Grid item xs={12} md={4}>
            <Paper className={classNames(classes.tile, classes.governanceTile)}>
              <Typography variant="subtitle1">Issue:</Typography>
              <Typography
                variant="h1"
                component="h3"
                className={classes.header}
              >
                Governance
              </Typography>
              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/issues/profit-and-incentives">
                  Profit incentives
                </Link>
              </Typography>
              <Typography variant="body1">
                Couchsurfing&#8482; is explicitly for-profit, prioritizing
                returns for investors over users and communities.
              </Typography>

              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/issues/communities-and-trust">
                  Neglected communities
                </Link>
              </Typography>
              <Typography variant="body1">
                The community has been ignored, too many users have been pushed
                onto the platform, trust between members has been eroded.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classNames(classes.tile, classes.designTile)}>
              <Typography variant="subtitle1">Issue:</Typography>
              <Typography
                variant="h1"
                component="h3"
                className={classes.header}
              >
                Design
              </Typography>
              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/issues/creeps-and-freeloaders">Safety</Link>
              </Typography>
              <Typography variant="body1">
                Detrimental users threaten users' safety, especially for women.
                Freeloaders abound.
              </Typography>

              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/issues/reviews">Reference system</Link>
              </Typography>
              <Typography variant="body1">
                You can't trust people based on references.
              </Typography>

              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/issues/host-matching">Super-host effect</Link>
              </Typography>
              <Typography variant="body1">
                Local communities have been shrinking to just small groups of
                super-hosts.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classNames(classes.tile, classes.techTile)}>
              <Typography variant="subtitle1">Issue:</Typography>
              <Typography
                variant="h1"
                component="h3"
                className={classes.header}
              >
                Technology
              </Typography>
              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/issues/the-build">The bugs and app issues</Link>
              </Typography>
              <Typography variant="body1">
                There are far too many bugs and problems with the
                Couchsurfing&#8482; platform. It wasn't good enough as a free
                service, and it's definitely not good enough now that it's paid.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <div className={classes.spacer} />
      <Container component="section" maxWidth="md">
        <Typography component="h2" className={classes.header}>
          Our plan for the next-generation couch surfing platform
        </Typography>
      </Container>
      <Container
        component="section"
        maxWidth="lg"
        className={classes.tileSection}
      >
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          <Grid item xs={12} md={4}>
            <Paper className={classNames(classes.tile, classes.governanceTile)}>
              <Typography variant="subtitle1">Our plan:</Typography>
              <Typography
                variant="h1"
                component="h3"
                className={classes.header}
              >
                Governance
              </Typography>
              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/plan/profit-and-incentives">
                  Non-profit structure
                </Link>
              </Typography>
              <Typography variant="body1">
                This platform will be run as a non-profit, taking no outside
                investment. The priorities will be the users and community.
              </Typography>

              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/plan/communities-and-trust">
                  Community-first framework
                </Link>
              </Typography>
              <Typography variant="body1">
                We will build communities into the foundations of the product,
                and improve trust through a new verification method.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classNames(classes.tile, classes.designTile)}>
              <Typography variant="subtitle1">Our plan:</Typography>
              <Typography
                variant="h1"
                component="h3"
                className={classes.header}
              >
                Design
              </Typography>
              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/plan/creeps-and-freeloaders">
                  Member accountability
                </Link>
              </Typography>
              <Typography variant="body1">
                Users will be accountable for how they treat other members,
                filtering out creeps and freeloaders.
              </Typography>

              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/plan/reviews">Improved review system</Link>
              </Typography>
              <Typography variant="body1">
                Overhauled references to reflect more accurately on users.
              </Typography>

              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/plan/host-matching">Better host finding</Link>
              </Typography>
              <Typography variant="body1">
                Healthier communities by spreading out hosting opportunities and
                no message limits.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classNames(classes.tile, classes.techTile)}>
              <Typography variant="subtitle1">Our plan:</Typography>
              <Typography
                variant="h1"
                component="h3"
                className={classes.header}
              >
                Technology
              </Typography>
              <Typography
                variant="h2"
                component="h3"
                className={classes.topicLink}
              >
                <Link href="/plan/the-build">Build it right</Link>
              </Typography>
              <Typography variant="body1">
                Our platform is developer-led. We will build this right, make it
                scalable, and listen to the community to fix bugs. We want to
                make something to be proud of.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <div className={classes.spacer} />
      <Container component="section" maxWidth="md">
        <Typography className={classes.para}>
          Read more about Couchers.org on our{" "}
          <StyledLink href={blogRoute}>Blog</StyledLink>.
        </Typography>
      </Container>
    </>
  );
}
