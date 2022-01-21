import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import LabelAndText from "components/LabelAndText";
import Markdown from "components/Markdown";
import booleanConversion, {
  parkingDetailsLabels,
  sleepingArrangementLabels,
  smokingLocationLabels,
  UNSURE,
} from "features/profile/constants";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { User } from "proto/api_pb";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "50%",
  },
  root: {
    display: "flex",
    justifyContent: "space-between",
  },

  marginTop3: {
    marginTop: theme.spacing(3),
  },
}));

interface HomeProps {
  user: User.AsObject;
}

export default function Home({ user }: HomeProps) {
  const classes = useStyles();
  const { t } = useTranslation([GLOBAL]);

  return (
    <>
      <div className={classes.root}>
        <div className={classes.info}>
          <Typography variant="h1">{t("global:hosting_preferences")}</Typography>
          <LabelAndText
            label={t("global:last_minute")}
            text={booleanConversion(user.lastMinute?.value)}
          />
          <LabelAndText
            label={t("global:wheelchair")}
            text={booleanConversion(user.wheelchairAccessible?.value)}
          />
          <LabelAndText
            label={t("global:accept_camping")}
            text={booleanConversion(user.campingOk?.value)}
          />
          <LabelAndText
            label={t("global:max_guests")}
            text={`${user.maxGuests?.value || UNSURE}`}
          />
          <LabelAndText
            label={t("global:accept_kids")}
            text={booleanConversion(user.acceptsKids?.value)}
          />
          <LabelAndText
            label={t("global:accept_pets")}
            text={booleanConversion(user.acceptsPets?.value)}
          />
          <LabelAndText
            label={t("global:accept_drinking")}
            text={booleanConversion(user.drinkingAllowed?.value)}
          />
          <LabelAndText
            label={t("global:accept_smoking")}
            text={`${smokingLocationLabels[user.smokingAllowed]}`}
          />
        </div>
        <div className={classes.info}>
          <Typography variant="h1">{t("global:my_home")}</Typography>
          <LabelAndText
            label={t("global:space")}
            text={`${sleepingArrangementLabels[user.sleepingArrangement]}`}
          />
          <LabelAndText
            label={t("global:parking")}
            text={booleanConversion(user.parking?.value)}
          />
          <LabelAndText
            label={t("global:parking_details")}
            text={parkingDetailsLabels[user.parkingDetails]}
          />
          <LabelAndText
            label={t("global:has_housemates")}
            text={`${booleanConversion(user.hasHousemates?.value)}${
              user.housemateDetails?.value
                ? `, ${user.housemateDetails?.value}`
                : ""
            }`}
          />
          <LabelAndText
            label={t("global:host_kids")}
            text={`${booleanConversion(user.hasKids?.value)}${
              user.kidDetails?.value ? `, ${user.kidDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={t("global:host_pets")}
            text={`${booleanConversion(user.hasPets?.value)}${
              user.petDetails?.value ? `, ${user.petDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={t("global:host_drinking")}
            text={booleanConversion(user.drinksAtHome?.value)}
          />
          <LabelAndText
            label={t("global:host_smoking")}
            text={booleanConversion(user.smokesAtHome?.value)}
          />
        </div>
      </div>
      <Divider className={classes.marginTop3} />
      {user.aboutPlace && (
        <>
          <Typography variant="h1">{t("global:about_home")}</Typography>
          <Markdown source={user.aboutPlace} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.area && (
        <>
          <Typography variant="h1">{t("global:local_area")}</Typography>
          <Markdown source={user.area?.value} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.sleepingDetails && (
        <>
          <Typography variant="h1">{t("global:sleeping_arrangement")}</Typography>
          <Markdown source={user.sleepingDetails?.value} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.houseRules && (
        <>
          <Typography variant="h1">{t("global:house_rules")}</Typography>
          <Markdown source={user.houseRules?.value} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.otherHostInfo && (
        <>
          <Typography variant="h1">{t("global:additional")}</Typography>
          <Markdown source={user.otherHostInfo?.value} />
        </>
      )}
    </>
  );
}
