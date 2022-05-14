import { Container } from "@material-ui/core";
import { DASHBOARD } from "i18n/namespaces";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import makeStyles from "utils/makeStyles";

import HeroButton from "./HeroButton";
import HeroImageAttribution from "./HeroImageAttribution";
import HeroLinks from "./HeroLinks";
import HeroSearch from "./HeroSearch";
// Photo by Mesut Kaya on Unsplash - https://unsplash.com/photos/eOcyhe5-9sQ
import heroImage from "./mesut-kaya-eOcyhe5-9sQ-unsplash.jpeg";

const useStyles = makeStyles((theme) => ({
  outerContainer: {
    position: "relative",
  },
  contentContainer: {
    zIndex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2, 2),
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(4, 2),
    },
  },
}));

export default function Hero() {
  const { t } = useTranslation(DASHBOARD);
  const classes = useStyles();

  return (
    <div className={classes.outerContainer}>
      <Container maxWidth="md" className={classes.contentContainer}>
        <HeroLinks />
        <HeroSearch />
        <HeroButton />
      </Container>

      <div>{/* scroll hint arrow */}</div>

      <HeroImageAttribution />

      <Image
        src={heroImage}
        placeholder="blur"
        layout="fill"
        objectFit="cover"
        objectPosition="50% 50%"
        alt={t("hero_image_alt")}
      />
    </div>
  );
}
