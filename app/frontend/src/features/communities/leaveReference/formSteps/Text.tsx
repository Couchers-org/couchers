import { Typography } from "@material-ui/core";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import {
  PUBLIC_ANSWER,
  REFERENCE_FORM_HEADING,
  TEXT_EXPLANATION,
} from "features/communities/constants";
import { User } from "pb/api_pb";
import React from "react";
import { useHistory, useParams } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../../routes";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function Text({ user }: ReferenceFormProps) {
  const history = useHistory();
  const { referenceType } = useParams<{
    referenceType: string;
  }>();

  return (
    <>
      <Typography variant="h1">
        {REFERENCE_FORM_HEADING}
        {user.name}
      </Typography>
      <TextBody>{TEXT_EXPLANATION}</TextBody>
      <TextBody>{PUBLIC_ANSWER}</TextBody>
      <TextField
        className="multiline"
        fullWidth={true}
        multiline={true}
        rows={15}
        id="reference-text-input"
      ></TextField>

      <Button
        onClick={() => {
          history.push(
            `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/submit`
          );
        }}
      >
        Submit
      </Button>
    </>
  );
}
