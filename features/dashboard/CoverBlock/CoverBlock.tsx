import { Container } from "@material-ui/core";
import Image from "next/image";
import makeStyles from "utils/makeStyles";

import CoverBlockSearch from "./CoverBlockSearch";
import CoverButton from "./CoverButton";
import CoverImageAttribution from "./CoverImageAttribution";
import CoverLinks from "./CoverLinks";
// Photo by Mesut Kaya on Unsplash - https://unsplash.com/photos/eOcyhe5-9sQ
import coverBlockImage from "./mesut-kaya-eOcyhe5-9sQ-unsplash.jpeg";

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

export default function CoverBlock() {
  const classes = useStyles();

  return (
    <div className={classes.outerContainer}>
      <Container maxWidth="md" className={classes.contentContainer}>
        <CoverLinks />
        <CoverBlockSearch />
        <CoverButton />
      </Container>

      <div>{/* scroll hint arrow */}</div>

      <CoverImageAttribution />

      <Image
        src={coverBlockImage}
        placeholder="blur"
        layout="fill"
        objectFit="cover"
        objectPosition="50% 50%"
        alt="Background with hot-air balloons in Capadocia"
      />
    </div>
  );
}
