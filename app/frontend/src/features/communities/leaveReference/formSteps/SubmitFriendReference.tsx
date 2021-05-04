import { Typography } from "@material-ui/core";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import {
  FURTHER,
  REFERENCE_CONFIRM,
  REFERENCE_SUBMIT_HEADING,
  THANK_YOU,
} from "features/communities/constants";
import { User } from "pb/api_pb";
import React from "react";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function SubmitFriendReference({ user }: ReferenceFormProps) {
  return (
    <>
      <Typography variant="h1">{REFERENCE_SUBMIT_HEADING}</Typography>
      <TextBody>{THANK_YOU}</TextBody>
      <TextBody>{REFERENCE_CONFIRM}</TextBody>
      <UserSummary user={user} />
      <TextBody>{FURTHER}</TextBody>
    </>
  );
}
