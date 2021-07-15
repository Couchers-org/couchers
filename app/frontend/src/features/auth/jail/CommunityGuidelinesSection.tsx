import {
  Avatar,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  SvgIcon,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import { useIsMounted, useSafeState } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import {
  COMMUNITY_GUIDELINE_ICONS,
  COMMUNITY_GUIDELINE_LABEL,
  COMMUNITY_GUIDELINE_TITLES,
  COMMUNITY_GUIDELINES,
  COMMUNITY_GUIDELINES_REQUIRED,
  COMMUNITY_GUIDELINES_SECTION_HEADING,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "30rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gridGap: theme.spacing(2, 2),
  },
  avatar: {
    backgroundColor: theme.palette.grey[300],
  },
  icon: {
    fill: "none ",
  },
  button: {
    marginBlockStart: theme.spacing(2),
  },
}));

interface CommunityGuidelinesSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function CommunityGuidelinesSection({
  updateJailed,
  className,
}: CommunityGuidelinesSectionProps) {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [completed, setCompleted] = useSafeState(isMounted, false);
  const [error, setError] = useState("");

  const { control, handleSubmit, errors, formState } = useForm({
    mode: "onChange",
  });

  const submit = handleSubmit(async () => {
    try {
      const info = await service.jail.setAcceptedCommunityGuidelines(true);
      if (!info.isJailed) {
        updateJailed();
      } else {
        //if user is no longer jailed, this component will be unmounted anyway
        setCompleted(true);
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  });

  return (
    <div className={classes.root}>
      <Typography variant="h2" gutterBottom>
        {COMMUNITY_GUIDELINES_SECTION_HEADING}
      </Typography>
      <form onSubmit={submit} className={className}>
        {error && <Alert severity="error">{error}</Alert>}

        <div className={classes.grid}>
          {COMMUNITY_GUIDELINES.map((_, index) => (
            <React.Fragment key={`guideline-${index}`}>
              <Avatar className={classes.avatar}>
                <SvgIcon
                  component={COMMUNITY_GUIDELINE_ICONS[index]}
                  fontSize="large"
                  className={classes.icon}
                />
              </Avatar>
              <div>
                <Typography variant="h3" color="primary">
                  {COMMUNITY_GUIDELINE_TITLES[index]}
                </Typography>
                <Typography variant="body1">
                  {COMMUNITY_GUIDELINES[index]}
                </Typography>
                <Controller
                  control={control}
                  name={`ok${index}`}
                  defaultValue={false}
                  rules={{ required: COMMUNITY_GUIDELINES_REQUIRED }}
                  render={({ onChange, value }) => (
                    <FormControl>
                      <FormControlLabel
                        label={
                          <Typography variant="body1">
                            {COMMUNITY_GUIDELINE_LABEL}
                          </Typography>
                        }
                        control={
                          <Checkbox
                            checked={value}
                            onChange={(_, checked) => onChange(checked)}
                          />
                        }
                      />

                      {errors?.[`ok${index}`]?.message && (
                        <FormHelperText error={true}>
                          {errors[`ok${index}`].message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </div>
            </React.Fragment>
          ))}
        </div>

        <Button
          onClick={submit}
          disabled={completed || !formState.isValid}
          className={classes.button}
        >
          {completed ? "Thanks!" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
