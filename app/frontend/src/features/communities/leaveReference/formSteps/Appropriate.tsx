import {
  Card,
  CardContent,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import TextBody from "components/TextBody";
import {
  APPROPRIATE_BEHAVIOR,
  APPROPRIATE_EXPLANATION,
  APPROPRIATE_QUESTION,
  NEXT,
  PRIVATE_ANSWER,
  REFERENCE_FORM_HEADING,
  SAFETY_PRIORITY,
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

export default function Appropriate({ user }: ReferenceFormProps) {
  const history = useHistory();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { referenceType } = useParams<{
    referenceType: string;
  }>();
  const { data, setValues } = useData()!;
  const { control, handleSubmit, errors } = useForm<typeof data>({
    defaultValues: {
      wasAppropriate: data.wasAppropriate,
    },
  });

  const onSubmit = (values: typeof data) => {
    setValues(values);
    history.push(
      `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/rating`
    );
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h1">
        {REFERENCE_FORM_HEADING}
        {user.name}
      </Typography>
      <TextBody>{APPROPRIATE_EXPLANATION}</TextBody>
      <TextBody>{PRIVATE_ANSWER}</TextBody>
      {errors && errors.wasAppropriate?.message && (
        <Alert severity="error">{errors.wasAppropriate.message}</Alert>
      )}
      <Card>
        <CardContent>
          <Typography variant="h3">{APPROPRIATE_BEHAVIOR}</Typography>
          <Divider />
          <TextBody>{SAFETY_PRIORITY}</TextBody>
          <InputLabel>{APPROPRIATE_QUESTION}</InputLabel>
          <Controller
            as={
              <RadioGroup aria-label="wasAppropriate">
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label="Yes"
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label="No"
                />
              </RadioGroup>
            }
            name="wasAppropriate"
            control={control}
          />
        </CardContent>
      </Card>
      <Button fullWidth={!isMdOrWider} type="submit">
        {NEXT}
      </Button>
    </form>
  );
}
