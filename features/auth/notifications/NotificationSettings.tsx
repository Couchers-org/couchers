import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { Error as GrpcError } from "grpc-web";
import {
  GetNotificationSettingsRes,
  SetNotificationSettingsRes,
} from "proto/notifications_pb";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("auth");

  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<
    GetNotificationSettingsRes.AsObject,
    GrpcError
  >(
    notificationSettingsQueryKey,
    service.notifications.getNotificationSettings
  );

  const mutation = useMutation<
    SetNotificationSettingsRes.AsObject,
    GrpcError,
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
            The new notification system is currently{" "}
            <b>{data.newNotificationsEnabled ? "enabled" : "disabled"}</b> for
            your account.
          </Typography>
          <Typography variant="body1">
            <Button
              onClick={() => toggleNewNotifications()}
              loading={mutation.isLoading}
            >
              {data.newNotificationsEnabled ? "Disable" : "Enable"} new
              notification system.
            </Button>
          </Typography>
        </>
      )}
    </div>
  );
}
