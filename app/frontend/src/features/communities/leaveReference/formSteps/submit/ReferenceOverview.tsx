import { Hidden, List, ListItem, Typography } from "@material-ui/core";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import {
  COUCHER_WAS_APPROPRIATE,
  COUCHER_WAS_NOT_APPROPRIATE,
  FURTHER,
  PRIVATE_REFERENCE,
  PUBLIC_REFERENCE,
  RATING,
  RATING_SCALE,
  REFERENCE_MOBILE_USER,
  REFERENCE_SUBMIT_HEADING,
  THANK_YOU,
} from "features/communities/constants";
import { useData } from "features/communities/leaveReference/ReferenceDataContext";
import { ReferenceFormProps } from "features/communities/leaveReference/ReferenceForm";
import React from "react";

export default function ReferenceOverview({ user }: ReferenceFormProps) {
  const { data } = useData()!;

  return (
    <>
      <Typography variant="h1">{REFERENCE_SUBMIT_HEADING}</Typography>
      <TextBody>{THANK_YOU}</TextBody>
      <Hidden mdUp>
        <TextBody>{REFERENCE_MOBILE_USER}</TextBody>
        <UserSummary user={user} />
      </Hidden>
      <Typography variant="h3">{PUBLIC_REFERENCE}</Typography>
      <TextBody>{data.text}</TextBody>
      <Typography variant="h3">{PRIVATE_REFERENCE}</Typography>
      <List>
        {data.wasAppropriate === "true" ? (
          <ListItem>{COUCHER_WAS_APPROPRIATE}</ListItem>
        ) : (
          <ListItem>{COUCHER_WAS_NOT_APPROPRIATE}</ListItem>
        )}
        <ListItem>
          {RATING}
          {data.rating}
          {RATING_SCALE}
        </ListItem>
      </List>
      <TextBody>{FURTHER}</TextBody>
    </>
  );
}
