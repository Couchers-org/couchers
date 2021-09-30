import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import {
  ADDITIONAL,
  HOBBIES,
  LIVED_IN,
  OVERVIEW,
  TRAVELED_TO,
  TRAVELS,
  WHO,
} from "features/constants";
import { User } from "proto/api_pb";
import makeStyles from "utils/makeStyles";

import { useRegions } from "../hooks/useRegions";
import {
  LabelsAgeGenderLanguages,
  RemainingAboutLabels,
} from "./UserTextAndLabel";

interface AboutProps {
  user: User.AsObject;
}
const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(1),
  },
  countriesContainer: {
    display: "flex",
    marginTop: theme.spacing(1),
    "& > div": {
      display: "flex",
      flexDirection: "column",
    },
  },
  countriesList: {
    margin: theme.spacing(0, 1),
  },
  countryLabel: {
    display: "flex",
    alignItems: "center",
  },
  traveledToColor: {
    width: "100%",
    display: "block",
    height: theme.spacing(0.5),
    backgroundColor: theme.palette.primary.main,
  },
  livedInColor: {
    width: "100%",
    display: "block",
    height: theme.spacing(0.5),
    backgroundColor: theme.palette.secondary.main,
  },
  labelMarker: {
    fontWeight: "bold",
    display: "inline-block",
    width: theme.spacing(1),
    height: theme.spacing(1),
    marginRight: theme.spacing(2),
  },

  marginTop3: {
    marginTop: theme.spacing(3),
  },
}));

export default function About({ user }: AboutProps) {
  const classes = useStyles();
  const { regions } = useRegions();
  return (
    <div className={classes.root}>
      <Typography variant="h1">{OVERVIEW}</Typography>
      <LabelsAgeGenderLanguages user={user} />
      <RemainingAboutLabels user={user} />
      <Divider className={classes.marginTop3} />
      {user.aboutMe && (
        <>
          <Typography variant="h1">{WHO}</Typography>
          <Markdown source={user.aboutMe} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.thingsILike && (
        <>
          <Typography variant="h1">{HOBBIES}</Typography>
          <Markdown source={user.thingsILike} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.additionalInformation && (
        <>
          <Typography variant="h1">{ADDITIONAL}</Typography>
          <Markdown source={user.additionalInformation} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      <Typography variant="h1">{TRAVELS}</Typography>
      <div className={classes.countriesContainer}>
        <div>
          <div className={classes.countryLabel}>
            <span
              className={`${classes.traveledToColor} ${classes.labelMarker}`}
            ></span>
            <Typography variant="body1">{TRAVELED_TO}</Typography>
          </div>
          <div className={classes.countryLabel}>
            <span
              className={`${classes.livedInColor} ${classes.labelMarker}`}
            ></span>
            <Typography variant="body1">{LIVED_IN}</Typography>
          </div>
        </div>
        {regions ? (
          <>
            <ul className={classes.countriesList}>
              <span className={classes.traveledToColor}></span>
              {user.regionsVisitedList.map((country) => (
                <li key={`Visited ${country}`}>
                  <Typography variant="body1">{regions[country]}</Typography>
                </li>
              ))}
            </ul>
            <ul className={classes.countriesList}>
              <span className={classes.livedInColor}></span>
              {user.regionsLivedList.map((country) => (
                <li key={`Lived in ${country}`}>
                  <Typography variant="body1">{regions[country]}</Typography>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
