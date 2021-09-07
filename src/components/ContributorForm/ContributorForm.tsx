import {
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Error as GrpcError } from "grpc-web";
import {
  ContributeOption,
  ContributorForm as ContributorFormPb,
} from "proto/auth_pb";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";

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

const useStyles = makeStyles((theme) => ({
  contributeRadio: {
    marginBlockEnd: theme.spacing(3),
  },
  label: { display: "block" },
  textbox: {
    marginBlockEnd: theme.spacing(3),
    marginBlockStart: theme.spacing(1),
  },
  radioLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginBlockEnd: theme.spacing(1),
  },
}));

interface ContributorFormProps {
  processForm: (form: ContributorFormPb.AsObject) => Promise<void>;
  autofocus?: boolean;
}

export default function ContributorForm({
  processForm,
  autofocus = false,
}: ContributorFormProps) {
  const classes = useStyles();

  const { control, register, handleSubmit, errors, watch } =
    useForm<ContributorInputs>({
      mode: "onBlur",
      shouldUnregister: false,
    });

  const mutation = useMutation<void, GrpcError, ContributorInputs>(
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
            []
          )
        )
        .setExpertise(data.expertise);
      await processForm(form.toObject());
    }
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
            className={classes.label}
          >
            {IDEAS_LABEL}
          </Typography>
          <TextField
            inputRef={(el: HTMLInputElement | null) => {
              if (!ideasInputRef.current && autofocus) el?.focus();
              if (el) ideasInputRef.current = el;
              register(el);
            }}
            id="ideas"
            margin="normal"
            name="ideas"
            helperText={IDEAS_HELPER}
            fullWidth
            multiline
            minRows={4}
            maxRows={6}
            className={classes.textbox}
          />
          <Typography
            variant="body1"
            htmlFor="features"
            component="label"
            className={classes.label}
          >
            {FEATURES_LABEL}
          </Typography>
          <TextField
            inputRef={register}
            id="features"
            margin="normal"
            name="features"
            helperText={FEATURES_HELPER}
            fullWidth
            multiline
            minRows={4}
            maxRows={6}
            className={classes.textbox}
          />
          <Controller
            id="contribute"
            control={control}
            name="contribute"
            defaultValue=""
            render={({ onChange, value }) => (
              <FormControl component="fieldset">
                <FormLabel component="legend" className={classes.radioLabel}>
                  {CONTRIBUTE_LABEL}
                </FormLabel>
                <RadioGroup
                  className={classes.contributeRadio}
                  row
                  name="contribute-radio"
                  onChange={(e, value) => onChange(value)}
                  value={value}
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
            <FormControl component="fieldset">
              <FormLabel component="legend" className={classes.radioLabel}>
                {CONTRIBUTE_WAYS_LABEL}
              </FormLabel>
              <FormGroup>
                {CONTRIBUTE_WAYS_OPTIONS.map(({ name, description }) => (
                  <Controller
                    key={name}
                    control={control}
                    name={`contributeWays.${name}`}
                    defaultValue={false}
                    render={({ onChange, value }) => (
                      <FormControlLabel
                        value={name}
                        control={
                          <Checkbox
                            checked={value}
                            onChange={(e, checked) => onChange(checked)}
                          />
                        }
                        label={description}
                      />
                    )}
                  />
                ))}
              </FormGroup>
              <FormHelperText error={!!errors?.contributeWays?.message}>
                {errors?.contributeWays?.message ?? " "}
              </FormHelperText>
            </FormControl>
            <Typography
              variant="body1"
              htmlFor="expertise"
              component="label"
              className={classes.label}
            >
              {EXPERTISE_LABEL}
            </Typography>
            <TextField
              inputRef={register}
              id="expertise"
              margin="normal"
              name="expertise"
              helperText={errors?.expertise?.message ?? EXPERTISE_HELPER}
              error={!!errors?.expertise?.message}
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
              className={classes.textbox}
            />
            <Typography
              variant="body1"
              htmlFor="experience"
              component="label"
              className={classes.label}
            >
              {EXPERIENCE_LABEL}
            </Typography>
            <TextField
              inputRef={register}
              id="experience"
              margin="normal"
              name="experience"
              helperText={EXPERIENCE_HELPER}
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
              className={classes.textbox}
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
