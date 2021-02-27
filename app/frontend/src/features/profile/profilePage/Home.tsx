import { makeStyles, Typography } from "@material-ui/core";
import React from "react";

import Divider from "../../../components/Divider";
import LabelAndText from "../../../components/LabelAndText";
import { User } from "../../../pb/api_pb";
import {
  ABOUT_HOME,
  ACCEPT_DRINKING,
  ACCEPT_KIDS,
  ACCEPT_PETS,
  ACCEPT_SMOKING,
  ADDITIONAL,
  CAMPING,
  HAS_HOUSEMATES,
  HOME_PHOTOS,
  HOST_DRINKING,
  HOST_KIDS,
  HOST_PETS,
  HOST_SMOKING,
  HOSTING_PREFERENCES,
  HOUSEMATES,
  LAST_MINUTE,
  MAX_GUESTS,
  PARKING,
  SPACE,
  TRANSPORTATION,
  WHEELCHAIR,
} from "../../constants";

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "50%",
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
            text={`${user.lastMinute?.value || ""}`}
          />
          <LabelAndText label={MAX_GUESTS} text={`${user.maxGuests}`} />
          <LabelAndText
            label={ACCEPT_SMOKING}
            text={`${user.smokingAllowed}`}
          />
          <LabelAndText
            label={ACCEPT_DRINKING}
            text={`${user.drinkingAllowed}`}
          />
          <LabelAndText
            label={ACCEPT_PETS}
            text={`${user.acceptsPets?.value || ""}`}
          />
          <LabelAndText
            label={ACCEPT_KIDS}
            text={`${user.acceptsKids?.value || ""}`}
          />
          <LabelAndText label={CAMPING} text={`${user.campingOk}`} />
          <LabelAndText
            label={WHEELCHAIR}
            text={`${user.wheelchairAccessible?.value || ""}`}
          />
        </div>
        <div className={classes.info}>
          <Typography variant="h1">{ABOUT_HOME}</Typography>
          <LabelAndText
            label={SPACE}
            text={`${user.sleepingArrangement || ""}`}
          />
          <LabelAndText
            label={HAS_HOUSEMATES}
            text={`${user.hasHousemates} ${user.housemateDetails}`}
          />
          <LabelAndText label={HOST_SMOKING} text={`${user.smokesAtHome}`} />
          <LabelAndText label={HOST_DRINKING} text={`${user.drinksAtHome}`} />
          <LabelAndText
            label={HOST_PETS}
            text={`${user.hasPets?.value || ""} ${user.petDetails}`}
          />
          <LabelAndText
            label={HOST_KIDS}
            text={`${user.hasKids?.value || ""} ${user.kidDetails}`}
          />
          <LabelAndText label={PARKING} text={`${user.parking}`} />
          <LabelAndText label="" text="" />
        </div>
      </div>
      <Divider />
      <Typography variant="h1">{HOUSEMATES}</Typography>
      <Typography variant="body1">{user.housemateDetails}</Typography>
      <Divider />
      <Typography variant="h1">{HOME_PHOTOS}</Typography>
      <Typography variant="body1">not sure what goes here</Typography>
      <Divider />
      <Typography variant="h1">{TRANSPORTATION}</Typography>
      <Typography variant="body1">{user.parkingDetails}</Typography>
      <Divider />
      <Typography variant="h1">{ADDITIONAL}</Typography>
      <Typography variant="body1">{user.otherHostInfo}</Typography>
    </>
  );
}
