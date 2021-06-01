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
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextField from "components/TextField";
import {
  ContributeOption,
  ContributorForm as ContributorFormPb,
} from "pb/account_pb";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  CONTRIBUTE_ARIA_LABEL,
  CONTRIBUTE_LABEL,
  CONTRIBUTE_OPTIONS,
  CONTRIBUTE_WAYS_ARIA_LABEL,
  CONTRIBUTE_WAYS_LABEL,
  CONTRIBUTE_WAYS_OPTIONS,
  EXPERIENCE_HELPER,
  EXPERIENCE_LABEL,
  EXPERTISE_HELPER,
  EXPERTISE_LABEL,
  FEATURES_HELPER,
  FEATURES_LABEL,
  FILL_IN_THE_FORM,
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
}));

interface ContributorFormProps {
  processForm: (form: ContributorFormPb) => Promise<boolean>;
}

export default function ContributorForm({ processForm }: ContributorFormProps) {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { control, register, handleSubmit, errors } =
    useForm<ContributorInputs>({
      mode: "onBlur",
      shouldUnregister: false,
    });

  const submit = handleSubmit(async (data: ContributorInputs) => {
    setLoading(true);
    let contribute = ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED;
    switch (data.contribute) {
      case "yes":
        contribute = ContributeOption.CONTRIBUTE_OPTION_YES;
        break;
      case "maybe":
        contribute = ContributeOption.CONTRIBUTE_OPTION_MAYBE;
        break;
      case "no":
        contribute = ContributeOption.CONTRIBUTE_OPTION_NO;
        break;
    }
    const form = new ContributorFormPb()
      .setIdeas(data.ideas)
      .setFeatures(data.features)
      .setExperience(data.experience)
      .setContribute(contribute)
      .setContributeWaysList(data.contribute.split(",").filter((v) => !!v))
      .setExpertise(data.expertise);
    setSuccess(await processForm(form));
    setLoading(false);
  });

  const toggleCheckbox = (
    option: string,
    contribute: string,
    setContribute: (s: string) => void
  ) => {
    const currentChoices = contribute.split(",").filter((v) => !!v);
    if (currentChoices.includes(option)) {
      setContribute(currentChoices.filter((opt) => opt !== option).join(","));
    } else {
      setContribute(currentChoices.concat(option).join(","));
    }
  };

  return loading ? (
    <CircularProgress />
  ) : (
    <>
      {success ? (
        <>
          <Typography variant="body1">{SUCCESS_MSG}</Typography>
        </>
      ) : (
        <form onSubmit={submit}>
          <Typography variant="body1">{FILL_IN_THE_FORM}</Typography>
          <Typography variant="body1">{QUESTIONS_OPTIONAL}</Typography>
          <TextField
            inputRef={register}
            id="ideas"
            margin="normal"
            name="ideas"
            label={IDEAS_LABEL}
            helperText={IDEAS_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <TextField
            inputRef={register}
            id="features"
            margin="normal"
            name="features"
            label={FEATURES_LABEL}
            helperText={FEATURES_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <Controller
            id="contribute"
            control={control}
            name="contribute"
            defaultValue=""
            render={({ onChange }) => (
              <FormControl>
                <FormLabel component="legend">{CONTRIBUTE_LABEL}</FormLabel>
                <RadioGroup
                  className={classes.contributeRadio}
                  aria-label={CONTRIBUTE_ARIA_LABEL}
                  name="contribute-radio"
                  onChange={onChange}
                >
                  {CONTRIBUTE_OPTIONS.map((opt) => (
                    <FormControlLabel
                      key={opt}
                      value={opt}
                      control={<Radio />}
                      label={opt}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          />
          <TextField
            inputRef={register}
            id="experience"
            margin="normal"
            name="experience"
            label={EXPERIENCE_LABEL}
            helperText={EXPERIENCE_HELPER}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <Controller
            id="contributeWays"
            control={control}
            name="contributeWays"
            defaultValue=""
            render={({ onChange, value }) => (
              <FormControl>
                <FormLabel>{CONTRIBUTE_WAYS_LABEL}</FormLabel>
                <FormGroup aria-label={CONTRIBUTE_WAYS_ARIA_LABEL}>
                  {CONTRIBUTE_WAYS_OPTIONS.map(({ name, description }) => (
                    <FormControlLabel
                      key={name}
                      value={name}
                      control={
                        <Checkbox
                          checked={value.includes(name)}
                          onChange={() => toggleCheckbox(name, value, onChange)}
                          name={name}
                        />
                      }
                      label={description}
                    />
                  ))}
                </FormGroup>
                <FormHelperText error={!!errors?.contributeWays?.message}>
                  {errors?.contributeWays?.message ?? " "}
                </FormHelperText>
              </FormControl>
            )}
          />
          <TextField
            id="expertise"
            margin="normal"
            name="expertise"
            label={EXPERTISE_LABEL}
            helperText={errors?.expertise?.message ?? EXPERTISE_HELPER}
            error={!!errors?.expertise?.message}
            fullWidth
            multiline
            rows={4}
            rowsMax={6}
          />
          <Button onClick={submit} type="submit" loading={loading}>
            {SUBMIT}
          </Button>
        </form>
      )}
    </>
  );
}
