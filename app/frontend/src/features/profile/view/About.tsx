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
    "& div": {
      display: "flex",
      flexDirection: "column",
    },
  },
  countriesList: {
    margin: `0 ${theme.spacing(1)}`,
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
          <Typography variant="body1">{TRAVELED_TO}</Typography>
          <Typography variant="body1">{LIVED_IN}</Typography>
        </div>
        <ul className={classes.countriesList}>
          {user.countriesVisitedList.map((country) => (
            <li>
              <Typography variant="body1">{country}</Typography>
            </li>
          ))}
        </ul>
        <ul className={classes.countriesList}>
          {user.countriesLivedList.map((country) => (
            <li>
              <Typography variant="body1">{country}</Typography>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
