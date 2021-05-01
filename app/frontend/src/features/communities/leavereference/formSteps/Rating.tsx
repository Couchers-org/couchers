import { Typography } from "@material-ui/core";
import Button from "components/Button";
import RatingsSlider from "components/RatingsSlider";
import TextBody from "components/TextBody";
import {
  PRIVATE_ANSWER,
  QUESTION_MARK,
  RATING_EXPLANATION,
  RATING_QUESTION,
  REFERENCE_FORM_HEADING,
} from "features/communities/constants";
import { User } from "pb/api_pb";
import React from "react";
import { useHistory } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../../routes";

interface ReferenceFormProps {
  user: User.AsObject;
  refType: string;
}

export default function Rating({ user, refType }: ReferenceFormProps) {
  const history = useHistory();

  return (
    <>
      <Typography variant="h1">
        {REFERENCE_FORM_HEADING}
        {user.name}
      </Typography>
      <TextBody>{RATING_EXPLANATION}</TextBody>
      <TextBody>{PRIVATE_ANSWER}</TextBody>
      <TextBody>
        {RATING_QUESTION}
        {user.name}
        {QUESTION_MARK}
      </TextBody>
      <RatingsSlider />
      <Button
        onClick={() => {
          history.push(
            `${leaveReferenceBaseRoute}/${refType}/${user.userId}/reference`
          );
        }}
      >
        Submit
      </Button>
    </>
  );
}
