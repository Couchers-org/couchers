import { makeStyles, Typography } from "@material-ui/core";
import Divider from "components/Divider";
import {
  ABOUT_HOME,
  ADDITIONAL,
  HOBBIES,
  LIVED_IN,
  OVERVIEW,
  TRAVELED_TO,
  TRAVELS,
  WHO,
} from "features/constants";
import {
  LabelsAgeGenderLanguages,
  RemainingAboutLabels,
} from "features/user/UserTextAndLabel";
import { User } from "pb/api_pb";

interface AboutProps {
  user: User.AsObject;
}
const useStyles = makeStyles((theme) => ({
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
    backgroundColor: "#00A398",
  },
  livedInColor: {
    width: "100%",
    display: "block",
    height: theme.spacing(0.5),
    backgroundColor: "#E47701",
  },
  labelMarker: {
    fontWeight: "bold",
    display: "inline-block",
    width: theme.spacing(1),
    height: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
}));

export default function About({ user }: AboutProps) {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h1">{OVERVIEW}</Typography>
      <LabelsAgeGenderLanguages user={user} />
      <RemainingAboutLabels user={user} />
      <Divider />
      <Typography variant="h1">{WHO}</Typography>
      <Typography variant="body1">{user.aboutMe}</Typography>
      <Divider />
      <Typography variant="h1">{HOBBIES}</Typography>
      <Typography variant="body1">{user.thingsILike}</Typography>
      <Divider />
      <Typography variant="h1">{ABOUT_HOME}</Typography>
      <Typography variant="body1">{user.aboutPlace}</Typography>
      <Divider />
      <Typography variant="h1">{ADDITIONAL}</Typography>
      <Typography variant="body1">{user.additionalInformation}</Typography>
      <Divider />
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
        <ul className={classes.countriesList}>
          <span className={classes.traveledToColor}></span>
          {user.countriesVisitedList.map((country) => (
            <li key={`Visited ${country}`}>
              <Typography variant="body1">{country}</Typography>
            </li>
          ))}
        </ul>
        <ul className={classes.countriesList}>
          <span className={classes.livedInColor}></span>
          {user.countriesLivedList.map((country) => (
            <li key={`Lived in ${country}`}>
              <Typography variant="body1">{country}</Typography>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
