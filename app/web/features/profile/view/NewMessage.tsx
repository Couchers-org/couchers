import { CardActions, Skeleton, styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
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

const StyledSendActions = styled(CardActions)(() => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(2),
}));

export default function NewMessage({ setIsMessaging }: { setIsMessaging: (value: boolean) => void }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const router = useRouter();
  const { openGroupChat, openProfileUserId } = useProfileSheet();

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<{ text: string }>();

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
    mutate(data);
  });

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
          <StyledSendActions>
            <Button onClick={() => setIsMessaging(false)} variant="outlined">
              {t("global:cancel")}
            </Button>
            <Button type="submit" onClick={onSubmit} loading={isPending}>
              {t("global:send")}
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
