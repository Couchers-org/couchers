import { makeStyles, Typography } from "@material-ui/core";
import React from "react";

import Markdown from "../../components/Markdown";
import TextBody from "../../components/TextBody";
import { SmokingLocation, User } from "../../pb/api_pb";
import { smokingLocationLabels } from "../profile/constants";

const useStyles = makeStyles((theme) => ({
  list: {
    listStyle: "none",
    padding: 0,
    marginBlockStart: 0,
    marginBlockEnd: theme.spacing(1),
  },
  listItem: {},
  hostingPreferenceResponse: {
    fontWeight: "bold",
  },
  subheading: {
    fontSize: "1.25rem",
  },
}));

export default function UserPlace({ user }: { user: User.AsObject }) {
  const classes = useStyles();

  return (
    <>
      <Typography variant="h3" className={classes.subheading}>
        Hosting preferences
      </Typography>
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
        {user.multipleGroups && (
          <HostingPreferenceListItem
            label="Multiple groups ok?"
            value={user.multipleGroups?.value ? "Yes" : "No"}
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
      <Typography variant="h3" className={classes.subheading}>
        About my place
      </Typography>
      <Markdown
        source={
          user.aboutPlace || `${user.name} hasn't put any place info yet.`
        }
      />
      {user.area && (
        <>
          <Typography variant="h3" className={classes.subheading}>
            About the area
          </Typography>
          <TextBody>{user.area.value}</TextBody>
        </>
      )}
      {user.houseRules && (
        <>
          <Typography variant="h3" className={classes.subheading}>
            House rules
          </Typography>
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
