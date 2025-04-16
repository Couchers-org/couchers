import { Circle } from "@mui/icons-material";
import { Avatar, Box, MenuItem, styled, Typography } from "@mui/material";
import { NOTIFICATIONS_LAST_SEEN_AT_COOKIE_NAME } from "components/Navigation/LoggedInMenu";
import dayjs from "dayjs";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Notification } from "proto/notifications_pb";
import LinesEllipsis from "react-lines-ellipsis";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

import { mapNotificationFeedTypeToIcon } from "../utils/constants";

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
  overflow: "hidden",
  minWidth: 0,
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(5),
  height: theme.spacing(5),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const BottomRightIconWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: -2,
  right: -2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();

  const userName = notification.title.split(" ")[0];
  const lastSeenAt = dayjs(
    window.localStorage.getItem(NOTIFICATIONS_LAST_SEEN_AT_COOKIE_NAME),
  );
  const isSeen =
    lastSeenAt && dayjs(timestamp2Date(notification.created!)) < lastSeenAt;

  const handleMenuItemClick = () => {
    router.push(notification.url);
  };

  return (
    <StyledMenuItem key={notification.key} onClick={handleMenuItemClick}>
      <AvatarWrapper>
        <Avatar alt={userName} src={notification.icon} />
        <BottomRightIconWrapper>
          {mapNotificationFeedTypeToIcon[notification.topic]}
        </BottomRightIconWrapper>
      </AvatarWrapper>
      <FlexColumn>
        <LinesEllipsis
          text={notification.title}
          maxLine={2}
          ellipsis="..."
          style={{
            fontSize: theme.typography.body2.fontSize,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          {timeAgoI18n({
            input: timestamp2Date(notification.created!),
            t,
          })}
        </Typography>
      </FlexColumn>
      {!isSeen && (
        <Circle
          sx={{
            color: theme.palette.primary.main,
            fontSize: ".9rem",
            position: "absolute",
            right: theme.spacing(2),
            bottom: theme.spacing(2),
          }}
        />
      )}
    </StyledMenuItem>
  );
};

export default NotificationItem;
