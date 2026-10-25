import { useFeatureValue } from "@growthbook/growthbook-react";
import { AlertTitle, CardActions, Skeleton, styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useLogEvent } from "features/analytics/hooks";
import { doAntibot } from "features/antibot/antibot";
import { looksLikeHostRequest } from "features/messages/looksLikeHostRequest";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { HostingStatus } from "proto/api_pb";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { routeToGroupChat } from "routes";
import { service } from "service";
import { theme } from "theme";

const StyledTitle = styled(Typography)(() => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledMessageField = styled(TextField)(() => ({
  marginTop: theme.spacing(2),
}));

const StyledNudgeBenefits = styled("ul")(() => ({
  margin: theme.spacing(1, 0, 2),
  paddingInlineStart: theme.spacing(2.5),
}));

const StyledSendActions = styled(CardActions)(() => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(2),
}));

const NUDGE_DEBOUNCE_MS = 500;

interface NewMessageProps {
  setIsMessaging: (value: boolean) => void;
  onRequestInstead: (text: string) => void;
}

export default function NewMessage({ setIsMessaging, onRequestInstead }: NewMessageProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const router = useRouter();
  const { openGroupChat, openProfileUserId } = useProfileSheet();
  const logEvent = useLogEvent();

  const isNudgeEnabled = useFeatureValue("show_host_request_nudge", false);
  const canNudge = isNudgeEnabled && user.hostingStatus !== HostingStatus.HOSTING_STATUS_CANT_HOST;
  const [isNudgeShown, setIsNudgeShown] = useState(false);
  const hasLoggedNudge = useRef(false);

  const {
    getValues,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<{ text: string }>();

  const text = watch("text") ?? "";

  useEffect(() => {
    if (!canNudge) return;
    const timeout = setTimeout(() => setIsNudgeShown(looksLikeHostRequest(text)), NUDGE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [canNudge, text]);

  useEffect(() => {
    if (isNudgeShown && !hasLoggedNudge.current) {
      hasLoggedNudge.current = true;
      logEvent("host_request_nudge.shown", { host_user_id: user.userId });
    }
  }, [isNudgeShown, logEvent, user.userId]);

  const { error, mutate, isPending } = useMutation<number, Error, { text: string }>({
    mutationFn: (data) => service.conversations.sendDirectMessage(user.userId, data.text),
    onSuccess: (groupChatId) => {
      reset();
      setIsMessaging(false);
      if (openProfileUserId !== null) {
        openGroupChat(groupChatId);
      } else {
        router.push(routeToGroupChat(groupChatId));
      }
    },
  });

  const { isLoading: userLoading, error: userError } = useLiteUser(user.userId);

  const onSubmit = handleSubmit((data) => {
    // Catches a message sent before the debounced check has had a chance to run.
    if (canNudge && !isNudgeShown && looksLikeHostRequest(data.text)) {
      setIsNudgeShown(true);
      return;
    }
    mutate(data);
  });

  const requestInstead = () => {
    logEvent("host_request_nudge.accepted", { host_user_id: user.userId });
    doAntibot("host_request");
    onRequestInstead(getValues("text"));
    reset();
    setIsNudgeShown(false);
    hasLoggedNudge.current = false;
  };

  return (
    <>
      <StyledTitle variant="h1">
        {userLoading ? <Skeleton width="100" /> : t("profile:message_form.send_message", { name: user.name })}
      </StyledTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      {userError ? (
        <Alert severity={"error"}>{userError?.message}</Alert>
      ) : (
        <form onSubmit={onSubmit}>
          <StyledMessageField
            id="text"
            {...register("text", {
              required: t("profile:message_form.message_empty"),
            })}
            label={t("profile:message_form.message")}
            minRows={6}
            multiline
            fullWidth
            placeholder={t("profile:message_form.message_description")}
            error={!!errors.text}
            helperText={errors.text?.message}
          />
          {isNudgeShown && (
            <Alert severity="info" sx={{ marginTop: theme.spacing(2) }}>
              <AlertTitle>{t("profile:message_form.host_request_nudge.title", { name: user.name })}</AlertTitle>
              {t("profile:message_form.host_request_nudge.intro")}
              <StyledNudgeBenefits>
                <li>{t("profile:message_form.host_request_nudge.benefit_dates", { name: user.name })}</li>
                <li>{t("profile:message_form.host_request_nudge.benefit_response_rate")}</li>
                <li>{t("profile:message_form.host_request_nudge.benefit_references")}</li>
              </StyledNudgeBenefits>
              <Button onClick={requestInstead} size="small">
                {t("profile:message_form.host_request_nudge.request_instead_button")}
              </Button>
            </Alert>
          )}
          <StyledSendActions>
            <Button onClick={() => setIsMessaging(false)} variant="outlined">
              {t("global:cancel")}
            </Button>
            <Button type="submit" onClick={onSubmit} loading={isPending}>
              {isNudgeShown ? t("profile:message_form.host_request_nudge.send_as_message_button") : t("global:send")}
            </Button>
          </StyledSendActions>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            <Trans i18nKey="profile:message_form.hosting_request_hint" components={{ request: <strong /> }} />
          </Typography>
        </form>
      )}
    </>
  );
}
