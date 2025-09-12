import { Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { DO_NOT_EMAIL_QUERY_KEY } from "@/features/queryKeys";
import { Trans, useTranslation } from "@/i18n";
import { AUTH } from "@/i18n/namespaces";
import { GetNotificationSettingsRes } from "@/proto/notifications_pb";
import { service } from "@/service";

interface DoNotEmailFormData {
  doNotEmailEnabled: boolean;
}

const DoNotEmail = () => {
  const { t } = useTranslation(AUTH);

  const queryClient = useQueryClient();

  const { data, error, isPending } = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >({
    queryKey: [DO_NOT_EMAIL_QUERY_KEY],
    queryFn: service.notifications.getNotificationSettings,
  });

  const mutation = useMutation<
    GetNotificationSettingsRes.AsObject,
    RpcError,
    DoNotEmailFormData
  >({
    mutationFn: ({ doNotEmailEnabled }) =>
      service.notifications.setNotificationSettings(doNotEmailEnabled),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [DO_NOT_EMAIL_QUERY_KEY],
      });
    },
  });

  const toggleDoNotEmail = () => {
    if (!data) return;
    mutation.mutate({
      doNotEmailEnabled: !data.doNotEmailEnabled,
    });
  };

  return (
    <div>
      <Typography variant="h2">{t("do_not_email.title")}</Typography>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message}</Alert>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isPending || !data ? (
        <CenteredSpinner />
      ) : (
        <>
          <Typography variant="body1" gutterBottom>
            <Trans
              t={t}
              i18nKey={
                data.doNotEmailEnabled
                  ? "do_not_email.status.no_emails_enabled_message"
                  : "do_not_email.status.no_emails_disabled_message"
              }
            >
              Emails are currently <strong>disabled/enabled</strong> for your
              account.
            </Trans>
          </Typography>
          <Typography variant="body1">
            <Button
              onClick={() => {
                toggleDoNotEmail();
              }}
              loading={mutation.isPending}
            >
              {data.doNotEmailEnabled
                ? t("do_not_email.action_button.no_emails_disable_text")
                : t("do_not_email.action_button.no_emails_enable_text")}
            </Button>
          </Typography>
        </>
      )}
    </div>
  );
};

export default DoNotEmail;
