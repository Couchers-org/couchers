import {
  Avatar,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  styled,
  Typography,
  TypographyVariant,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { communityGuidelinesQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { GetCommunityGuidelinesRes } from "proto/resources_pb";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";
import { useIsMounted, useSafeState } from "utils/hooks";

interface CommunityGuidelinesProps {
  onSubmit: (accept: boolean) => Promise<void>;
  className?: string;
  title?: TypographyVariant;
}

const StyledGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: theme.spacing(2, 2),
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.grey[300],
  "& img": {
    fill: "none",
    width: "2rem",
    objectFit: "unset",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginBlockStart: theme.spacing(2),
}));

export default function CommunityGuidelines({
  onSubmit,
  className,
  title,
}: CommunityGuidelinesProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
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

  const { control, handleSubmit, formState } = useForm({
    mode: "onChange",
  });

  const { errors } = formState;

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
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
    }
  });

  if (loadError) {
    // Re-throw error to trigger error boundary to encourage user to report it
    // if we can't load stuff
    throw loadError;
  }

  if (isLoading) {
    return <CenteredSpinner />;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <form onSubmit={submit} className={className}>
        {title && (
          <Typography variant={title} gutterBottom>
            {t("auth:community_guidelines_form.header")}
          </Typography>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        <StyledGrid>
          {data.communityGuidelinesList.map(
            ({ title, guideline, iconSvg }, index) => (
              <React.Fragment key={index}>
                <StyledAvatar
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
                        "auth:community_guidelines_form.guideline.required_error",
                      ),
                    }}
                    render={({ field }) => (
                      <FormControl variant="standard">
                        <FormControlLabel
                          label={
                            <Typography variant="body1">
                              {t(
                                "auth:community_guidelines_form.guideline.checkbox_label",
                              )}
                            </Typography>
                          }
                          control={
                            <Checkbox
                              {...field}
                              checked={field.value}
                              onChange={(_, checked) => field.onChange(checked)}
                            />
                          }
                        />

                        {errors?.[`ok${index}`]?.message && (
                          <FormHelperText error={true}>
                            {String(errors[`ok${index}`]?.message)}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </div>
              </React.Fragment>
            ),
          )}
        </StyledGrid>

        <StyledButton
          onClick={submit}
          disabled={completed || !formState.isValid}
        >
          {completed ? t("global:thanks") : t("global:continue")}
        </StyledButton>
      </form>
    </>
  );
}
