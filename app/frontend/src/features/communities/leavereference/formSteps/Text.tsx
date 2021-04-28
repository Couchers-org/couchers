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
import { useHistory } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../../routes";

interface ReferenceFormProps {
  user: User.AsObject;
  refType: string;
}

export default function Text({ user, refType }: ReferenceFormProps) {
  const history = useHistory();

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
            `${leaveReferenceBaseRoute}/${refType}/${user.userId}/submit`
          );
        }}
      >
        Submit
      </Button>
    </>
  );
}
