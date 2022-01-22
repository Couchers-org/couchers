import {
  Avatar as MuiAvatar,
  Card,
  CardContent,
  Grid,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { GlobeIcon, LinkedInIcon, PinIcon } from "components/Icons";
import IconText from "components/IconText";
import PageTitle from "components/PageTitle";
import Link from "next/link";
import { contributeRoute } from "routes";

import TeamData from "./team.json";

const useStyles = makeStyles((theme) => ({
  tightSection: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: "769px",
    marginTop: theme.spacing(3),
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
    width: "96px",
    height: "96px",
  },
  link: {
    color: theme.palette.primary.main,
  },
}));

export default function Team() {
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={"The Team"} />
      <section className={classes.tightSection}>
        <PageTitle>The Team</PageTitle>
        <Typography variant="body1" paragraph>
          We are all couch surfers and skilled professionals who want to build
          an improved, safer and more inclusive platform that can support and
          sustainably grow the couch surfing community and bring its values to
          the world. If you feel the same way and want to contribute, then we'd
          love to talk to you.
        </Typography>
        <Typography variant="body1" paragraph>
          <Link href={contributeRoute} passHref>
            <Button variant="contained" color="secondary">
              Join the team
            </Button>
          </Link>
        </Typography>
      </section>
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
                    <Typography variant={founder ? "h1" : "h2"}>
                      {name}
                    </Typography>
                    {founder && (
                      <Typography variant="h2">Co-founder</Typography>
                    )}
                    <Typography variant="h3">{role}</Typography>
                    <Typography variant="body1">
                      <IconText icon={PinIcon} text={location} />
                    </Typography>
                    {link && (
                      <Typography variant="body1">
                        <IconText
                          icon={
                            link.type === "linkedin" ? LinkedInIcon : GlobeIcon
                          }
                          text={
                            <a className={classes.link} href={link.url}>
                              {link.text}
                            </a>
                          }
                        />
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </section>
      <section className={classes.tightSection}>
        <Typography variant="h2" component="h2">
          Have skills you want to contribute?
        </Typography>
        <Typography variant="body1" paragraph>
          Couchers.org is a community project, built by folks like you for the
          benefit of the global couch surfing community. If you would like to be
          a part of this great new project, or leave your feedback on our ideas,
          click the button below and fill out the short form.
        </Typography>
        <Typography variant="body1" paragraph>
          <Link href={contributeRoute} passHref>
            <Button variant="contained" color="secondary">
              Join our team
            </Button>
          </Link>
        </Typography>
      </section>
    </>
  );
}
