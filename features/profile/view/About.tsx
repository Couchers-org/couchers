import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { User } from "proto/api_pb";
import makeStyles from "utils/makeStyles";

import { useRegions } from "../hooks/useRegions";
import { AgeGenderLanguagesLabels, RemainingAboutLabels } from "./userLabels";

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
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const classes = useStyles();
  const { regions } = useRegions();
  return (
    <div className={classes.root}>
      <Typography variant="h1">
        {t("profile:heading.overview_section")}
      </Typography>
      <AgeGenderLanguagesLabels user={user} />
      <RemainingAboutLabels user={user} />
      <Divider className={classes.marginTop3} />
      {user.aboutMe && (
        <>
          <Typography variant="h1">
            {t("profile:heading.who_section")}
          </Typography>
          <Markdown source={user.aboutMe} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.thingsILike && (
        <>
          <Typography variant="h1">
            {t("profile:heading.hobbies_section")}
          </Typography>
          <Markdown source={user.thingsILike} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.additionalInformation && (
        <>
          <Typography variant="h1">
            {t("profile:heading.additional_information_section")}
          </Typography>
          <Markdown source={user.additionalInformation} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      <Typography variant="h1">
        {t("profile:heading.travel_section")}
      </Typography>
      <Typography variant="body1">
        {regions && user.regionsVisitedList.length > 0
          ? user.regionsVisitedList
              .map((country) => regions[country])
              .join(`, `)
          : t("profile:regions_empty_state")}
      </Typography>
      <Divider className={classes.marginTop3} />
      <Typography variant="h1">{t("profile:heading.lived_section")}</Typography>
      <Typography variant="body1">
        {regions && user.regionsLivedList.length > 0
          ? user.regionsLivedList.map((country) => regions[country]).join(`, `)
          : t("profile:regions_empty_state")}
      </Typography>
    </div>
  );
}
