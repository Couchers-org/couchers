import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { Error as GrpcError } from "grpc-web";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { service } from "service";

type NotificationSettingsProps = {
  className?: string;
};

export default function NotificationSettings(props: NotificationSettingsProps) {
  const { t } = useTranslation("auth");

  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<
    GetNotificationSettingsRes.AsObject,
    GrpcError
  >(
    notificationSettingsQueryKey,
    service.notifications.getNotificationSettings
  );

  const toggleNewNotifications = async () => {
    await service.notifications.setNotificationSettings(
      !data?.newNotificationsEnabled
    );
    queryClient.invalidateQueries(notificationSettingsQueryKey);
  };

  const { className } = props;
  return (
    <div className={className}>
      <Typography variant="h2">{t("notification_settings.title")}</Typography>
      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <Typography variant="body1">
          The new notification system is currently{" "}
          <b>{data.newNotificationsEnabled ? "enabled" : "disabled"}</b> for
          your account.
          <br />
          <Button onClick={() => toggleNewNotifications()}>
            {data.newNotificationsEnabled ? "Disable" : "Enable"} new
            notification system.
          </Button>
        </Typography>
      )}
    </div>
  );
}
