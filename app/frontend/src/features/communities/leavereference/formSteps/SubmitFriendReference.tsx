import { Typography } from "@material-ui/core";
import { REFERENCE_FORM_HEADING } from "features/communities/constants";
import { User } from "pb/api_pb";
import React, { Dispatch, SetStateAction } from "react";
import { WriteFriendReferenceInput } from "service/references";

interface ReferenceFormProps {
  user: User.AsObject;
  requestData: WriteFriendReferenceInput;
  setRequestData: Dispatch<SetStateAction<WriteFriendReferenceInput>>;
}

export default function SubmitFriendReference({
  user,
  requestData,
  setRequestData,
}: ReferenceFormProps) {
  return (
    <>
      <Typography variant="h1">
        {REFERENCE_FORM_HEADING}
        {user.name}
      </Typography>
      <Typography variant="h2">Submit friend reference</Typography>
    </>
  );
}
