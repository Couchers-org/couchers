import {
  Avatar,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Typography,
  TypographyVariant,
  styled,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { communityGuidelinesQueryKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { Sentry } from "@/platform/sentry";
import { GetCommunityGuidelinesRes } from "@/proto/resources_pb";
import { service } from "@/service";
import isGrpcError from "@/service/utils/isGrpcError";
import { getErrorMessage } from "@/utils/error";
import { useIsMounted, useSafeState } from "@/utils/hooks";

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

const CommunityGuidelines = ({
  onSubmit,
  className,
  title,
}: CommunityGuidelinesProps) => {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const isMounted = useIsMounted();
  const [isCompleted, setIsCompleted] = useSafeState(isMounted, false);
  const [error, setError] = useState("");

  const {
    data,
    error: loadError,
    isLoading,
  } = useQuery<GetCommunityGuidelinesRes.AsObject, RpcError>({
    queryKey: [communityGuidelinesQueryKey],
    queryFn: () => service.resources.getCommunityGuidelines(),
  });

  const { control, handleSubmit, formState } = useForm({
    mode: "onChange",
  });

  const { errors } = formState;

  const submit = () =>
    handleSubmit(async () => {
      try {
        await onSubmit(true);
        setIsCompleted(true);
      } catch (e) {
        Sentry.captureException(e, {
          tags: {
            component: "component/communityGuidelines",
          },
        });
        if (isGrpcError(e)) {
          setError(
            isGrpcError(e) ? e.message : t("global:error.fatal_message"),
          );
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
            ({ title, guideline, iconSvg }, index) => {
              const errorMessage = getErrorMessage(errors[`ok${index}`]);

              return (
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
                                checked={field.value as boolean}
                                onChange={(_, checked) => {
                                  field.onChange(checked);
                                }}
                              />
                            }
                          />

                          {errorMessage && (
                            <FormHelperText error={true}>
                              {errorMessage}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </div>
                </React.Fragment>
              );
            },
          )}
        </StyledGrid>

        <StyledButton
          onClick={submit}
          disabled={isCompleted || !formState.isValid}
        >
          {isCompleted ? t("global:thanks") : t("global:submit")}
        </StyledButton>
      </form>
    </>
  );
};

export default CommunityGuidelines;
