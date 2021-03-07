import { makeStyles, Typography } from "@material-ui/core";
import Markdown from "components/Markdown";
import TextBody from "components/TextBody";
import { smokingLocationLabels } from "features/profile/constants";
import { SmokingLocation, User } from "pb/api_pb";
import React from "react";

const useStyles = makeStyles((theme) => ({
  hostingPreferenceResponse: {
    fontWeight: "bold",
  },
  list: {
    listStyle: "none",
    marginBlockEnd: theme.spacing(1),
    marginBlockStart: 0,
    padding: 0,
  },
  listItem: {},
}));

export default function UserPlace({ user }: { user: User.AsObject }) {
  const classes = useStyles();

  return (
    <>
      <Typography variant="h3">Hosting preferences</Typography>
      <ul className={classes.list}>
        {user.lastMinute && (
          <HostingPreferenceListItem
            label="Last minute requests ok?"
            value={user.lastMinute?.value ? "Yes" : "No"}
          />
        )}
        {user.maxGuests && (
          <HostingPreferenceListItem
            label="Max guests"
            value={user.maxGuests?.value.toString()}
          />
        )}
        {user.wheelchairAccessible && (
          <HostingPreferenceListItem
            label="Wheelchair accessible"
            value={user.wheelchairAccessible?.value ? "Yes" : "No"}
          />
        )}
        {user.smokingAllowed !== SmokingLocation.SMOKING_LOCATION_UNKNOWN &&
          user.smokingAllowed !==
            SmokingLocation.SMOKING_LOCATION_UNSPECIFIED && (
            <HostingPreferenceListItem
              label="Smoking allowed?"
              value={smokingLocationLabels[user.smokingAllowed]}
            />
          )}
        {user.acceptsKids && (
          <HostingPreferenceListItem
            label="Kids allowed?"
            value={user.acceptsKids?.value ? "Yes" : "No"}
          />
        )}
        {user.acceptsPets && (
          <HostingPreferenceListItem
            label="Pets allowed?"
            value={user.acceptsPets?.value ? "Yes" : "No"}
          />
        )}
      </ul>
      <Typography variant="h3">About my place</Typography>
      <Markdown
        source={
          user.aboutPlace || `${user.name} hasn't put any place info yet.`
        }
      />
      {user.area && (
        <>
          <Typography variant="h3">About the area</Typography>
          <TextBody>{user.area.value}</TextBody>
        </>
      )}
      {user.houseRules && (
        <>
          <Typography variant="h3">House rules</Typography>
          <TextBody>{user.houseRules.value}</TextBody>
        </>
      )}
    </>
  );
}

interface HostingPreferenceListItemProps {
  label: string;
  value: string;
}

const HostingPreferenceListItem = ({
  label,
  value,
}: HostingPreferenceListItemProps) => {
  const classes = useStyles();
  return (
    <li className={classes.listItem}>
      <TextBody>
        {`${label} `}
        <span className={classes.hostingPreferenceResponse}>{value}</span>
      </TextBody>
    </li>
  );
};
