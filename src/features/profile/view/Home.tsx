import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import LabelAndText from "components/LabelAndText";
import Markdown from "components/Markdown";
import {
  ABOUT_HOME,
  ACCEPT_CAMPING,
  ACCEPT_DRINKING,
  ACCEPT_KIDS,
  ACCEPT_PETS,
  ACCEPT_SMOKING,
  ADDITIONAL,
  HAS_HOUSEMATES,
  HOST_DRINKING,
  HOST_KIDS,
  HOST_PETS,
  HOST_SMOKING,
  HOSTING_PREFERENCES,
  HOUSE_RULES,
  LAST_MINUTE,
  LOCAL_AREA,
  MAX_GUESTS,
  MY_HOME,
  PARKING,
  PARKING_DETAILS,
  SLEEPING_ARRANGEMENT,
  SPACE,
  WHEELCHAIR,
} from "features/constants";
import booleanConversion, {
  parkingDetailsLabels,
  sleepingArrangementLabels,
  smokingLocationLabels,
  UNSURE,
} from "features/profile/constants";
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

  return (
    <>
      <div className={classes.root}>
        <div className={classes.info}>
          <Typography variant="h1">{HOSTING_PREFERENCES}</Typography>
          <LabelAndText
            label={LAST_MINUTE}
            text={booleanConversion(user.lastMinute?.value)}
          />
          <LabelAndText
            label={WHEELCHAIR}
            text={booleanConversion(user.wheelchairAccessible?.value)}
          />
          <LabelAndText
            label={ACCEPT_CAMPING}
            text={booleanConversion(user.campingOk?.value)}
          />
          <LabelAndText
            label={MAX_GUESTS}
            text={`${user.maxGuests?.value || UNSURE}`}
          />
          <LabelAndText
            label={ACCEPT_KIDS}
            text={booleanConversion(user.acceptsKids?.value)}
          />
          <LabelAndText
            label={ACCEPT_PETS}
            text={booleanConversion(user.acceptsPets?.value)}
          />
          <LabelAndText
            label={ACCEPT_DRINKING}
            text={booleanConversion(user.drinkingAllowed?.value)}
          />
          <LabelAndText
            label={ACCEPT_SMOKING}
            text={`${smokingLocationLabels[user.smokingAllowed]}`}
          />
        </div>
        <div className={classes.info}>
          <Typography variant="h1">{MY_HOME}</Typography>
          <LabelAndText
            label={SPACE}
            text={`${sleepingArrangementLabels[user.sleepingArrangement]}`}
          />
          <LabelAndText
            label={PARKING}
            text={booleanConversion(user.parking?.value)}
          />
          <LabelAndText
            label={PARKING_DETAILS}
            text={parkingDetailsLabels[user.parkingDetails]}
          />
          <LabelAndText
            label={HAS_HOUSEMATES}
            text={`${booleanConversion(user.hasHousemates?.value)}${
              user.housemateDetails?.value
                ? `, ${user.housemateDetails?.value}`
                : ""
            }`}
          />
          <LabelAndText
            label={HOST_KIDS}
            text={`${booleanConversion(user.hasKids?.value)}${
              user.kidDetails?.value ? `, ${user.kidDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={HOST_PETS}
            text={`${booleanConversion(user.hasPets?.value)}${
              user.petDetails?.value ? `, ${user.petDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={HOST_DRINKING}
            text={booleanConversion(user.drinksAtHome?.value)}
          />
          <LabelAndText
            label={HOST_SMOKING}
            text={booleanConversion(user.smokesAtHome?.value)}
          />
        </div>
      </div>
      <Divider className={classes.marginTop3} />
      {user.aboutPlace && (
        <>
          <Typography variant="h1">{ABOUT_HOME}</Typography>
          <Markdown source={user.aboutPlace} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.area && (
        <>
          <Typography variant="h1">{LOCAL_AREA}</Typography>
          <Markdown source={user.area?.value} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.sleepingDetails && (
        <>
          <Typography variant="h1">{SLEEPING_ARRANGEMENT}</Typography>
          <Markdown source={user.sleepingDetails?.value} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.houseRules && (
        <>
          <Typography variant="h1">{HOUSE_RULES}</Typography>
          <Markdown source={user.houseRules?.value} />
          <Divider className={classes.marginTop3} />
        </>
      )}
      {user.otherHostInfo && (
        <>
          <Typography variant="h1">{ADDITIONAL}</Typography>
          <Markdown source={user.otherHostInfo?.value} />
        </>
      )}
    </>
  );
}
