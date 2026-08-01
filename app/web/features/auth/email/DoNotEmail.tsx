import { Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { GetNotificationSettingsRes } from "couchers/proto/notifications_pb";
import { doNotEmailQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { service } from "service";

interface DoNotEmailFormData {
  doNotEmailEnabled: boolean;
}

export default function DoNotEmail() {
  const { t } = useTranslation(AUTH);

  const queryClient = useQueryClient();

  const { data, error, isPending } = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >({
    queryKey: [doNotEmailQueryKey],
    queryFn: service.notifications.getNotificationSettings,
  });

  const mutation = useMutation<
    GetNotificationSettingsRes.AsObject,
    RpcError,
    DoNotEmailFormData
  >({
    mutationFn: ({ doNotEmailEnabled }) =>
      service.notifications.setNotificationSettings(doNotEmailEnabled),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [doNotEmailQueryKey] });
    },
  });

  const toggleDoNotEmail = async () => {
    if (!data) return;
    mutation.mutate({
      doNotEmailEnabled: !data.doNotEmailEnabled,
    });
  };

  return (
    <div>
      <Typography variant="h2">{t("do_not_email.title")}</Typography>
      <Typography variant="body1" gutterBottom>
        {t("do_not_email.caveat")}
      </Typography>
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
              onClick={() => toggleDoNotEmail()}
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
}
