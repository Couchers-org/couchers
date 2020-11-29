import React from "react";
import { SmokingLocation, User } from "../../pb/api_pb";
import { makeStyles, Typography } from "@material-ui/core";
import TextBody from "../../components/TextBody";
import { smokingLocationLabels } from "../../constants";

const useStyles = makeStyles((theme) => ({
  list: {
    listStyle: "none",
    padding: 0,
    marginBlockStart: 0,
    //workaround for https://github.com/cssinjs/jss/issues/1414
    //still present despite upgrading to 10.5.0
    marginBlockEnd: `${theme.spacing(1)}px`,
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

  const preferences = [
    [
      !!user.lastMinute,
      "Last minute requests ok?",
      user.lastMinute?.value ? "Yes" : "No",
    ],
    [!!user.maxGuests, "Max guests", user.maxGuests?.value.toString()],
    [
      !!user.multipleGroups,
      "Multiple groups ok?",
      user.multipleGroups?.value ? "Yes" : "No",
    ],
    [
      !!user.wheelchairAccessible,
      "Wheelchair accessible",
      user.wheelchairAccessible?.value ? "Yes" : "No",
    ],
    [
      user.smokingAllowed !== SmokingLocation.SMOKING_LOCATION_UNKNOWN &&
        user.smokingAllowed !== SmokingLocation.SMOKING_LOCATION_UNSPECIFIED,
      "Smoking allowed?",
      smokingLocationLabels[user.smokingAllowed],
    ],
    [
      !!user.acceptsKids,
      "Kids allowed?",
      user.acceptsKids?.value ? "Yes" : "No",
    ],
    [
      !!user.acceptsPets,
      "Pets allowed?",
      user.acceptsPets?.value ? "Yes" : "No",
    ],
  ];

  return (
    <>
      <Typography variant="h3" className={classes.subheading}>
        Hosting preferences
      </Typography>
      <ul className={classes.list}>
        {preferences.map((pref, index) =>
          pref[0] ? (
            <li
              className={classes.listItem}
              key={`hosting-preference-${index}`}
            >
              <TextBody>
                {pref[1]}{" "}
                <span className={classes.hostingPreferenceResponse}>
                  {pref[2]}
                </span>
              </TextBody>
            </li>
          ) : null
        )}
      </ul>
      <Typography variant="h3" className={classes.subheading}>
        About my place
      </Typography>
      <TextBody>
        {user.aboutPlace || `${user.name} hasn't put any place info yet.`}
      </TextBody>{" "}
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
