import { Avatar, MenuItem, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Notification } from "proto/notifications_pb";
import LinesEllipsis from "react-lines-ellipsis";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

interface NotificationItemProps {
  notification: Notification.AsObject;
}

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(1),
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FlexColumn = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: "100%",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();

  const userName = notification.title.split(" ")[0];

  const handleMenuItemClick = () => {
    router.push(notification.url);
  };

  return (
    <StyledMenuItem onClick={handleMenuItemClick}>
      <Avatar alt={userName} src={notification.url}></Avatar>
      <FlexColumn>
        <LinesEllipsis
          text={notification.title}
          maxLine="2"
          ellipsis="..."
          style={{ fontSize: theme.typography.body2.fontSize }}
        />
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          {timeAgoI18n({
            input: timestamp2Date(notification.created!),
            t,
          })}
        </Typography>
      </FlexColumn>
    </StyledMenuItem>
  );
};

export default NotificationItem;
