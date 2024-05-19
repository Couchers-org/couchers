import { Link, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { service } from "service";

interface NotificationSettingFormData {
  newNotificationsEnabled: boolean;
}

export default function NotificationSettings({
  className,
}: {
  className: string;
}) {
  const { t } = useTranslation(AUTH);

  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >(
    notificationSettingsQueryKey,
    service.notifications.getNotificationSettings
  );

  const mutation = useMutation<
    GetNotificationSettingsRes.AsObject,
    RpcError,
    NotificationSettingFormData
  >(
    ({ newNotificationsEnabled }) =>
      service.notifications.setNotificationSettings(newNotificationsEnabled),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(notificationSettingsQueryKey);
      },
    }
  );

  const toggleNewNotifications = async () => {
    if (!data) return;
    mutation.mutate({
      newNotificationsEnabled: !data.newNotificationsEnabled,
    });
  };

  return (
    <div className={className}>
      <Typography variant="h2">{t("notification_settings.title")}</Typography>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message}</Alert>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading || !data ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1">
            <Trans
              t={t}
              i18nKey={
                data.newNotificationsEnabled
                  ? "notification_settings.status.enabled_message"
                  : "notification_settings.status.disabled_message"
              }
            >
              The new notification system is currently{" "}
              <strong>enabled/disabled</strong> for your account.
            </Trans>
          </Typography>
          <Typography variant="body1">
            <Button
              onClick={() => toggleNewNotifications()}
              loading={mutation.isLoading}
            >
              {data.newNotificationsEnabled
                ? t("notification_settings.action_button.disable_text")
                : t("notification_settings.action_button.enable_text")}
            </Button>
          </Typography>
          <Typography variant="body1">
            <Trans t={t} i18nKey="notification_settings.edit_in_console">
              You can change your notification settings{" "}
              <Link href="https://console.couchers.org/notifications">
                on this page
              </Link>
              . We will soon move it here.
            </Trans>
          </Typography>
        </>
      )}
    </div>
  );
}
