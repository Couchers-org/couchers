import { Typography } from "@material-ui/core";
import { REFERENCE_FORM_HEADING } from "features/communities/constants";
import { User } from "pb/api_pb";
import React from "react";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function SubmitRequestReference({ user }: ReferenceFormProps) {
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
