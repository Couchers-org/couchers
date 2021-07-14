import {
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import { useIsMounted, useSafeState } from "utils/hooks";

import {
  COMMUNITY_GUIDELINE_1,
  COMMUNITY_GUIDELINE_LABEL,
  COMMUNITY_GUIDELINE_TITLE_1,
  COMMUNITY_GUIDELINES_REQUIRED,
  COMMUNITY_GUIDELINES_SECTION_HEADING,
} from "./constants";

interface CommunityGuidelinesSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function CommunityGuidelinesSection({
  updateJailed,
  className,
}: CommunityGuidelinesSectionProps) {
  const isMounted = useIsMounted();
  const [completed, setCompleted] = useSafeState(isMounted, false);
  const [error, setError] = useState("");

  const { control, handleSubmit, errors } = useForm();

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
    <>
      <Typography variant="h2">
        {COMMUNITY_GUIDELINES_SECTION_HEADING}
      </Typography>
      <form onSubmit={submit} className={className}>
        {error && <Alert severity="error">{error}</Alert>}

        <Typography variant="h3">{COMMUNITY_GUIDELINE_TITLE_1}</Typography>
        <Typography variant="body1">{COMMUNITY_GUIDELINE_1}</Typography>
        <Controller
          control={control}
          name="ok1"
          defaultValue={false}
          rules={{ required: COMMUNITY_GUIDELINES_REQUIRED }}
          render={({ onChange, value }) => (
            <FormControl>
              <FormLabel className={" "}>{COMMUNITY_GUIDELINE_LABEL}</FormLabel>
              <Checkbox
                checked={value}
                onChange={(event) => onChange(event.target.value)}
              />
              <FormHelperText error={!!errors?.ok1?.message}>
                {errors?.ok1?.message ?? " "}
              </FormHelperText>
            </FormControl>
          )}
        />

        <TextBody>
          <Button onClick={submit} disabled={completed}>
            {completed ? "Thanks!" : "Continue"}
          </Button>
        </TextBody>
      </form>
    </>
  );
}
