import {
  Avatar,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Typography,
  TypographyVariant,
} from "@material-ui/core";
import * as Sentry from "@sentry/nextjs";
import Alert from "components/Alert";
import Button from "components/Button";
import { communityGuidelinesQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "next-i18next";
import { GetCommunityGuidelinesRes } from "proto/resources_pb";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { service } from "service";
import { useIsMounted, useSafeState } from "utils/hooks";
import isGrpcError from "utils/isGrpcError";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gridGap: theme.spacing(2, 2),
  },
  avatar: {
    backgroundColor: theme.palette.grey[300],
    "& img": {
      fill: "none",
      width: "2rem",
      objectFit: "unset",
    },
  },
  button: {
    marginBlockStart: theme.spacing(2),
  },
}));

interface CommunityGuidelinesProps {
  onSubmit: (accept: boolean) => Promise<void>;
  className?: string;
  title?: TypographyVariant;
}

export default function CommunityGuidelines({
  onSubmit,
  className,
  title,
}: CommunityGuidelinesProps) {
  const { t } = useTranslation(["auth", "global"]);
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [completed, setCompleted] = useSafeState(isMounted, false);
  const [error, setError] = useState("");

  const {
    data,
    error: loadError,
    isLoading,
  } = useQuery<GetCommunityGuidelinesRes.AsObject, RpcError>({
    queryKey: communityGuidelinesQueryKey,
    queryFn: () => service.resources.getCommunityGuidelines(),
  });

  const { control, handleSubmit, errors, formState } = useForm({
    mode: "onChange",
  });

  const submit = handleSubmit(async () => {
    try {
      await onSubmit(true);
      setCompleted(true);
    } catch (e) {
      Sentry.captureException(e, {
        tags: {
          component: "component/communityGuidelines",
        },
      });
      if (isGrpcError(e)) {
        setError(isGrpcError(e) ? e.message : t("global:fatal_error_message"));
      }
    }
  });

  if (loadError) {
    // Re-throw error to trigger error boundary to encourage user to report it
    // if we can't load stuff
    throw loadError;
  }

  return isLoading ? (
    <CircularProgress />
  ) : data ? (
    <>
      <form onSubmit={submit} className={className}>
        {title && (
          <Typography variant={title} gutterBottom>
            {t("auth:community_guidelines_form.header")}
          </Typography>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        <div className={classes.grid}>
          {data.communityGuidelinesList.map(
            ({ title, guideline, iconSvg }, index) => (
              <React.Fragment key={index}>
                <Avatar
                  className={classes.avatar}
                  src={`data:image/svg+xml,${encodeURIComponent(iconSvg)}`}
                />
                <div>
                  <Typography variant="h3" color="primary">
                    {title}
                  </Typography>
                  <Typography variant="body1">{guideline}</Typography>
                  <Controller
                    control={control}
                    name={`ok${index}`}
                    defaultValue={false}
                    rules={{
                      required: t(
                        "auth:community_guidelines_form.guideline.required_error"
                      ),
                    }}
                    render={({ onChange, value }) => (
                      <FormControl>
                        <FormControlLabel
                          label={
                            <Typography variant="body1">
                              {t(
                                "auth:community_guidelines_form.guideline.checkbox_label"
                              )}
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
            )
          )}
        </div>

        <Button
          onClick={submit}
          disabled={completed || !formState.isValid}
          className={classes.button}
        >
          {completed ? t("global:thanks") : t("global:continue")}
        </Button>
      </form>
    </>
  ) : null;
}
