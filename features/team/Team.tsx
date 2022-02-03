import {
  Avatar as MuiAvatar,
  Card,
  CardContent,
  Container,
  Grid,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { GlobeIcon, LinkedInIcon, PinIcon } from "components/Icons";
import IconText from "components/IconText";
import PageTitle from "components/PageTitle";
import StyledLink from "components/StyledLink";
import Link from "next/link";
import { contributeRoute } from "routes";

import TeamData from "./team.json";

const useStyles = makeStyles((theme) => ({
  spacer: {
    height: theme.spacing(4),
  },
  cardWrapper: {
    height: "100%",
  },
  card: {
    display: "flex",
  },
  cardContent: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    flex: "1 0 auto",
  },
  avatar: {
    width: theme.typography.pxToRem(96),
    height: theme.typography.pxToRem(96),
  },
}));

export default function Team() {
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title="The Team" />
      <Container maxWidth="md">
        <PageTitle>The Team</PageTitle>
        <Typography paragraph>
          We are all couch surfers and skilled professionals who want to build
          an improved, safer and more inclusive platform that can support and
          sustainably grow the couch surfing community and bring its values to
          the world. If you feel the same way and want to contribute, then we'd
          love to talk to you.
        </Typography>
        <Typography paragraph>
          <Link href={contributeRoute} passHref>
            <Button variant="contained" color="secondary">
              Join the team
            </Button>
          </Link>
        </Typography>
      </Container>
      <div className={classes.spacer} />
      <section>
        <Grid
          container
          spacing={2}
          justifyContent="center"
          alignItems="stretch"
        >
          {TeamData.map(({ name, founder, role, location, img, link }) => (
            <Grid key={name} item xs={12} md={!!founder ? 5 : 4}>
              <Card elevation={founder ? 3 : 1} className={classes.cardWrapper}>
                <CardContent className={classes.card}>
                  <MuiAvatar
                    alt={`Headshot of ${name}`}
                    src={img}
                    className={classes.avatar}
                  />
                  <div className={classes.cardContent}>
                    <Typography variant={founder ? "h1" : "h2"} component="h2">
                      {name}
                    </Typography>
                    {founder && (
                      <Typography variant="h2" component="h3">
                        Co-founder
                      </Typography>
                    )}
                    <Typography variant="h3">{role}</Typography>
                    <IconText icon={PinIcon} text={location} />
                    {link && (
                      <IconText
                        icon={
                          link.type === "linkedin" ? LinkedInIcon : GlobeIcon
                        }
                        text={
                          <Typography>
                            <StyledLink href={link.url}>{link.text}</StyledLink>
                          </Typography>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </section>
      <div className={classes.spacer} />
      <Container maxWidth="md">
        <Typography variant="h2" component="h2">
          Have skills you want to contribute?
        </Typography>
        <Typography paragraph>
          Couchers.org is a community project, built by folks like you for the
          benefit of the global couch surfing community. If you would like to be
          a part of this great new project, or leave your feedback on our ideas,
          click the button below and fill out the short form.
        </Typography>
        <Typography paragraph>
          <Link href={contributeRoute} passHref>
            <Button variant="contained" color="secondary">
              Join our team
            </Button>
          </Link>
        </Typography>
      </Container>
    </>
  );
}
