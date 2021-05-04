import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import Button from "components/Button";
import Divider from "components/Divider";
import TextBody from "components/TextBody";
import {
  APPROPRIATE_BEHAVIOR,
  APPROPRIATE_EXPLANATION,
  APPROPRIATE_QUESTION,
  PRIVATE_ANSWER,
  REFERENCE_FORM_HEADING,
  SAFETY_PRIORITY,
} from "features/communities/constants";
import { User } from "pb/api_pb";
import React from "react";
import { useHistory, useParams } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../../routes";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function Appropriate({ user }: ReferenceFormProps) {
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
      <TextBody>{APPROPRIATE_EXPLANATION}</TextBody>
      <TextBody>{PRIVATE_ANSWER}</TextBody>
      <Card>
        <CardContent>
          <Typography variant="h3">{APPROPRIATE_BEHAVIOR}</Typography>
          <Divider />
          <TextBody>{SAFETY_PRIORITY}</TextBody>
          <FormControl component="fieldset">
            <FormLabel>{APPROPRIATE_QUESTION}</FormLabel>
            <RadioGroup aria-label="appropriate-behavior" name="appropriate">
              <FormControlLabel value={true} control={<Radio />} label="Yes" />
              <FormControlLabel value={false} control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
      <Button
        onClick={() => {
          history.push(
            `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/rating`
          );
        }}
      >
        Submit
      </Button>
    </>
  );
}
