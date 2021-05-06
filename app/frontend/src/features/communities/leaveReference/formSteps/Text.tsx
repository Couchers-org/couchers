import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import {
  NEXT,
  PUBLIC_ANSWER,
  REFERENCE_FORM_HEADING,
  TEXT_EXPLANATION,
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

export default function Text({ user }: ReferenceFormProps) {
  const history = useHistory();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { referenceType } = useParams<{
    referenceType: string;
  }>();
  const { data, setValues } = useData()!;
  const { control, handleSubmit, errors } = useForm<typeof data>({
    defaultValues: {
      text: data.text,
    },
  });

  const onSubmit = (values: typeof data) => {
    setValues(values);
    history.push(
      `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/submit`
    );
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h1">
        {REFERENCE_FORM_HEADING}
        {user.name}
      </Typography>
      <TextBody>{TEXT_EXPLANATION}</TextBody>
      <TextBody>{PUBLIC_ANSWER}</TextBody>
      {errors && errors.text?.message && (
        <Alert severity="error">{errors.text.message}</Alert>
      )}
      <Controller
        render={({ ref }) => (
          <TextField
            className="multiline"
            fullWidth={true}
            multiline={true}
            rows={15}
            id="reference-text-input"
            inputRef={ref}
          />
        )}
        name="text"
        control={control}
      />
      <Button fullWidth={!isMdOrWider} type="submit">
        {NEXT}
      </Button>
    </form>
  );
}
