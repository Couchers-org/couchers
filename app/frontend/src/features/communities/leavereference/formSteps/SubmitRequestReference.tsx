import { Typography } from "@material-ui/core";
import { REFERENCE_FORM_HEADING } from "features/communities/constants";
import { User } from "pb/api_pb";
import React, { Dispatch, SetStateAction } from "react";
import { WriteHostRequestReferenceInput } from "service/references";

interface ReferenceFormProps {
  user: User.AsObject;
  requestData: WriteHostRequestReferenceInput;
  setRequestData: Dispatch<SetStateAction<WriteHostRequestReferenceInput>>;
}

export default function SubmitRequestReference({
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
      <Typography variant="h2">Submit request reference</Typography>
    </>
  );
}
