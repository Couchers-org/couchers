import {
  Checkbox,
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
  contributeWays: string;
  expertise: string;
};

const useStyles = makeStyles((theme) => ({
  contributeRadio: {
    display: "flex",
    flexDirection: "row",
  },
  label: { display: "block" },
  textbox: {
    marginBlockEnd: theme.spacing(3),
    marginBlockStart: theme.spacing(1),
  },
  radioLabel: { ...theme.typography.body1, color: theme.palette.text.primary },
}));

interface ContributorFormProps {
  processForm: (form: ContributorFormPb.AsObject) => Promise<void>;
}

export default function ContributorForm({ processForm }: ContributorFormProps) {
  const classes = useStyles();

  const { control, register, handleSubmit, errors } =
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
          data.contributeWays.split(",").filter((v) => !!v)
        )
        .setExpertise(data.expertise);
      await processForm(form.toObject());
    }
  );

  const submit = handleSubmit((data: ContributorInputs) => {
    mutation.mutate(data);
  });

  const toggleCheckbox = (
    option: string,
    value: string,
    onChange: (s: string) => void
  ) => {
    const currentChoices = value.split(",").filter((v) => !!v);
    if (currentChoices.includes(option)) {
      onChange(currentChoices.filter((opt) => opt !== option).join(","));
    } else {
      onChange(currentChoices.concat(option).join(","));
    }
  };

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
            inputRef={register}
            id="ideas"
            margin="normal"
            name="ideas"
            helperText={IDEAS_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
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
            rows={4}
            rowsMax={6}
            className={classes.textbox}
          />
          <Controller
            id="contribute"
            control={control}
            name="contribute"
            defaultValue=""
            render={({ onChange }) => (
              <FormControl>
                <FormLabel component="legend" className={classes.radioLabel}>
                  {CONTRIBUTE_LABEL}
                </FormLabel>
                <RadioGroup
                  className={classes.contributeRadio}
                  name="contribute-radio"
                  onChange={onChange}
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
            rows={4}
            rowsMax={6}
            className={classes.textbox}
          />
          <Controller
            id="contributeWays"
            control={control}
            name="contributeWays"
            defaultValue=""
            render={({ onChange, value }) => (
              <FormControl>
                <FormLabel className={classes.radioLabel}>
                  {CONTRIBUTE_WAYS_LABEL}
                </FormLabel>
                <FormGroup>
                  {CONTRIBUTE_WAYS_OPTIONS.map((option) => (
                    <FormControlLabel
                      key={option.name}
                      value={option.name}
                      control={
                        <Checkbox
                          checked={value.includes(option.name)}
                          onChange={() =>
                            toggleCheckbox(option.name, value, onChange)
                          }
                          name={option.name}
                        />
                      }
                      label={option.description}
                    />
                  ))}
                </FormGroup>
                <FormHelperText error={!!errors?.contributeWays?.message}>
                  {errors?.contributeWays?.message ?? " "}
                </FormHelperText>
              </FormControl>
            )}
          />
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
            rows={4}
            rowsMax={6}
            className={classes.textbox}
          />
          <Button onClick={submit} type="submit" loading={mutation.isLoading}>
            {SUBMIT}
          </Button>
        </form>
      )}
    </>
  );
}
