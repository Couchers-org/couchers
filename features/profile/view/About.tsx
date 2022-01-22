import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import {
  ADDITIONAL,
  HOBBIES,
  LIVED_IN,
  NONE,
  OVERVIEW,
  TRAVELED_TO,
  WHO,
} from "features/profile/constants";
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
      <Typography variant="h1">{TRAVELED_TO}</Typography>
      <Typography variant="body1">
        {regions && user.regionsVisitedList.length > 0
          ? user.regionsVisitedList
              .map((country) => regions[country])
              .join(`, `)
          : NONE}
      </Typography>
      <Divider className={classes.marginTop3} />
      <Typography variant="h1">{LIVED_IN}</Typography>
      <Typography variant="body1">
        {regions && user.regionsLivedList.length > 0
          ? user.regionsLivedList.map((country) => regions[country]).join(`, `)
          : NONE}
      </Typography>
    </div>
  );
}
