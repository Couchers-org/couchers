import {
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  FormLabelProps,
  Radio,
  RadioGroup,
  styled,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { RpcError } from "grpc-web";
import {
  ContributeOption,
  ContributorForm as ContributorFormPb,
} from "proto/auth_pb";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { theme } from "theme";

import {
  CONTRIBUTE_LABEL,
  CONTRIBUTE_OPTIONS,
  CONTRIBUTE_WAYS_LABEL,
  CONTRIBUTE_WAYS_OPTIONS,
  EXPERIENCE_HELPER,
  EXPERIENCE_LABEL,
  EXPERTISE_HELPER,
  EXPERTISE_LABEL,
  FEATURES_HELPER,
  FEATURES_LABEL,
  IDEAS_HELPER,
  IDEAS_LABEL,
  QUESTIONS_OPTIONAL,
  SUBMIT,
  SUCCESS_MSG,
} from "./constants";

type ContributorInputs = {
  ideas: string;
  features: string;
  experience: string;
  contribute: string;
  contributeWays: Record<string, boolean>;
  expertise: string;
};

interface ContributorFormProps {
  processForm: (form: ContributorFormPb.AsObject) => Promise<void>;
  autofocus?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBlockEnd: theme.spacing(3),
  marginBlockStart: theme.spacing(1),
}));

const StyledFormLabel = styled(FormLabel)<FormLabelProps>(({ theme }) => ({
  ...theme.typography.body1,
  color: theme.palette.text.primary,
  marginBlockEnd: theme.spacing(1),
}));

export default function ContributorForm({
  processForm,
  autofocus = false,
}: ContributorFormProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContributorInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const mutation = useMutation<void, RpcError, ContributorInputs>(
    async (data) => {
      let contribute = ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED;
      switch (data.contribute) {
        case "Yes":
          contribute = ContributeOption.CONTRIBUTE_OPTION_YES;
          break;
        case "Maybe":
          contribute = ContributeOption.CONTRIBUTE_OPTION_MAYBE;
          break;
        case "No":
          contribute = ContributeOption.CONTRIBUTE_OPTION_NO;
          break;
      }
      const form = new ContributorFormPb()
        .setIdeas(data.ideas)
        .setFeatures(data.features)
        .setExperience(data.experience)
        .setContribute(contribute)
        .setContributeWaysList(
          Object.entries(data.contributeWays).reduce<string[]>(
            //contributeWays is an object of "ways" as keys, and "checked" booleans as values
            //this reduces it to an array of the "ways" which were keys with "true" as a value
            (previous, [contributeWay, checked]) =>
              checked ? [...previous, contributeWay] : previous,
            [],
          ),
        )
        .setExpertise(data.expertise);
      await processForm(form.toObject());
    },
  );

  const submit = handleSubmit((data: ContributorInputs) => {
    mutation.mutate(data);
  });

  const watchContribute = watch("contribute");
  const ideasInputRef = useRef<HTMLInputElement>();

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      {mutation.isSuccess ? (
        <Typography variant="body1">{SUCCESS_MSG}</Typography>
      ) : (
        <form onSubmit={submit}>
          <Typography variant="body2" paragraph>
            {QUESTIONS_OPTIONAL}
          </Typography>
          <Typography
            variant="body1"
            htmlFor="ideas"
            component="label"
            sx={{ display: "block" }}
          >
            {IDEAS_LABEL}
          </Typography>
          <StyledTextField
            id="ideas"
            {...register("ideas")}
            inputRef={(el: HTMLInputElement | null) => {
              if (!ideasInputRef.current && autofocus) el?.focus();
              if (el) ideasInputRef.current = el;
            }}
            margin="normal"
            helperText={IDEAS_HELPER}
            fullWidth
            multiline
            minRows={4}
            maxRows={6}
          />
          <Typography
            variant="body1"
            htmlFor="features"
            component="label"
            sx={{ display: "block" }}
          >
            {FEATURES_LABEL}
          </Typography>
          <StyledTextField
            id="features"
            {...register("features")}
            margin="normal"
            helperText={FEATURES_HELPER}
            fullWidth
            multiline
            minRows={4}
            maxRows={6}
          />
          <Controller
            control={control}
            name="contribute"
            defaultValue=""
            render={({ field }) => (
              <FormControl variant="standard" component="fieldset">
                <StyledFormLabel component="legend">
                  {CONTRIBUTE_LABEL}
                </StyledFormLabel>
                <RadioGroup
                  id="contribute"
                  {...field}
                  sx={{ marginBlockEnd: theme.spacing(3) }}
                  row
                  name="contribute-radio"
                  onChange={(e, value) => field.onChange(value)}
                  value={field.value}
                >
                  {CONTRIBUTE_OPTIONS.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          />
          <Collapse in={watchContribute !== undefined}>
            <FormControl variant="standard" component="fieldset">
              <StyledFormLabel component="legend">
                {CONTRIBUTE_WAYS_LABEL}
              </StyledFormLabel>
              <FormGroup>
                {CONTRIBUTE_WAYS_OPTIONS.map(({ name, description }) => (
                  <Controller
                    key={name}
                    control={control}
                    name={`contributeWays.${name}`}
                    defaultValue={false}
                    render={({ field }) => (
                      <FormControlLabel
                        value={name}
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={(e, checked) => field.onChange(checked)}
                          />
                        }
                        label={description}
                      />
                    )}
                  />
                ))}
              </FormGroup>
              <FormHelperText error={!!errors?.contributeWays?.message}>
                {errors?.contributeWays?.message?.toString() ?? " "}
              </FormHelperText>
            </FormControl>
            <Typography
              variant="body1"
              htmlFor="expertise"
              component="label"
              sx={{ display: "block" }}
            >
              {EXPERTISE_LABEL}
            </Typography>
            <StyledTextField
              id="expertise"
              {...register("expertise")}
              margin="normal"
              helperText={errors?.expertise?.message ?? EXPERTISE_HELPER}
              error={!!errors?.expertise?.message}
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
            />
            <Typography
              variant="body1"
              htmlFor="experience"
              component="label"
              sx={{ display: "block" }}
            >
              {EXPERIENCE_LABEL}
            </Typography>
            <StyledTextField
              id="experience"
              {...register("experience")}
              margin="normal"
              helperText={EXPERIENCE_HELPER}
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
            />
          </Collapse>
          <Button
            onClick={submit}
            type="submit"
            loading={mutation.isLoading}
            fullWidth
          >
            {SUBMIT}
          </Button>
        </form>
      )}
    </>
  );
}
