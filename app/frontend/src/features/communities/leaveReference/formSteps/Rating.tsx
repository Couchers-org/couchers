import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import RatingsSlider from "components/RatingsSlider";
import TextBody from "components/TextBody";
import {
  NEXT,
  PRIVATE_ANSWER,
  QUESTION_MARK,
  RATING_EXPLANATION,
  RATING_QUESTION,
  REFERENCE_FORM_HEADING,
} from "features/communities/constants";
import { useData } from "features/communities/leaveReference/ReferenceDataContext";
import { User } from "pb/api_pb";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";

import { leaveReferenceBaseRoute } from "../../../../routes";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function Rating({ user }: ReferenceFormProps) {
  const history = useHistory();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { referenceType } = useParams<{
    referenceType: string;
  }>();
  const { data, setValues } = useData()!;
  const { control, handleSubmit, errors } = useForm<typeof data>({
    defaultValues: {
      rating: data.rating,
    },
  });

  const onSubmit = (values: typeof data) => {
    setValues(values);
    history.push(
      `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/reference`
    );
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h1">
        {REFERENCE_FORM_HEADING}
        {user.name}
      </Typography>
      <TextBody>{RATING_EXPLANATION}</TextBody>
      <TextBody>{PRIVATE_ANSWER}</TextBody>
      {errors && errors.rating?.message && (
        <Alert severity="error">{errors.rating.message}</Alert>
      )}
      <TextBody>
        {RATING_QUESTION}
        {user.name}
        {QUESTION_MARK}
      </TextBody>
      <Controller
        render={({ onChange }) => (
          <RatingsSlider
            onChange={onChange}
            value={data.rating}
            defaultValue={data.rating}
          />
        )}
        name="rating"
        control={control}
      />
      <Button fullWidth={!isMdOrWider} type="submit">
        {NEXT}
      </Button>
    </form>
  );
}
