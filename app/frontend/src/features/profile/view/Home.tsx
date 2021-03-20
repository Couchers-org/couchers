import { makeStyles, Typography } from "@material-ui/core";
import Divider from "components/Divider";
import LabelAndText from "components/LabelAndText";
import {
  ABOUT_HOME,
  ACCEPT_DRINKING,
  ACCEPT_KIDS,
  ACCEPT_PETS,
  ACCEPT_SMOKING,
  ADDITIONAL,
  CAMPING,
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
} from "features/profile/constants";
import { User } from "pb/api_pb";
import React from "react";

const useStyles = makeStyles(() => ({
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
            label={MAX_GUESTS}
            text={`${user.maxGuests?.value || 1}`}
          />
          <LabelAndText
            label={ACCEPT_SMOKING}
            text={`${smokingLocationLabels[user.smokingAllowed]}`}
          />
          <LabelAndText
            label={ACCEPT_DRINKING}
            text={booleanConversion(user.drinkingAllowed?.value)}
          />
          <LabelAndText
            label={ACCEPT_PETS}
            text={booleanConversion(user.acceptsPets?.value)}
          />
          <LabelAndText
            label={ACCEPT_KIDS}
            text={booleanConversion(user.acceptsKids?.value)}
          />
          <LabelAndText
            label={CAMPING}
            text={booleanConversion(user.campingOk?.value)}
          />
          <LabelAndText
            label={WHEELCHAIR}
            text={booleanConversion(user.wheelchairAccessible?.value)}
          />
        </div>
        <div className={classes.info}>
          <Typography variant="h1">{ABOUT_HOME}</Typography>
          <LabelAndText
            label={SPACE}
            text={`${sleepingArrangementLabels[user.sleepingArrangement]}`}
          />
          <LabelAndText
            label={HAS_HOUSEMATES}
            text={`${booleanConversion(user.hasHousemates?.value)} ${
              user.housemateDetails ? `, ${user.housemateDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={HOST_SMOKING}
            text={booleanConversion(user.smokesAtHome?.value)}
          />
          <LabelAndText
            label={HOST_DRINKING}
            text={booleanConversion(user.drinksAtHome?.value)}
          />
          <LabelAndText
            label={HOST_PETS}
            text={`${booleanConversion(user.hasPets?.value)} ${
              user.petDetails ? `, ${user.petDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={HOST_KIDS}
            text={`${booleanConversion(user.hasKids?.value)} ${
              user.kidDetails ? `, ${user.kidDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={PARKING}
            text={booleanConversion(user.parking?.value)}
          />
          <LabelAndText
            label={PARKING_DETAILS}
            text={parkingDetailsLabels[user.parkingDetails]}
          />
        </div>
      </div>
      <Divider />
      <Typography variant="h1">{LOCAL_AREA}</Typography>
      <Typography variant="body1">{user.area?.value}</Typography>
      <Divider />
      <Typography variant="h1">{SLEEPING_ARRANGEMENT}</Typography>
      <Typography variant="body1">{user.sleepingDetails?.value}</Typography>
      <Divider />
      <Typography variant="h1">{HOUSE_RULES}</Typography>
      <Typography variant="body1">{user.houseRules?.value}</Typography>
      <Divider />
      <Typography variant="h1">{ADDITIONAL}</Typography>
      <Typography variant="body1">{user.otherHostInfo?.value}</Typography>
    </>
  );
}
