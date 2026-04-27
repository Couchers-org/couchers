import { ArchiveOutlined, UnarchiveOutlined } from "@mui/icons-material";
import {
  capitalize,
  Chip,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  styled,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Avatar from "components/Avatar";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import HostRequestStatusIcon from "features/messages/requests/HostRequestStatusIcon";
import {
  controlMessage,
  hasUnreadMessages,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import { hostRequestsListKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { HostRequest } from "proto/requests_pb";
import React, { useState } from "react";
import { service } from "service";
import { theme } from "theme";
import { localizeDateTimeRange, UTC_TIMEZONE } from "utils/date";
import dayjs from "utils/dayjs";
import { firstName } from "utils/names";

import HostRequestStatusText from "./HostRequestStatusText";

const StyledHostStatusContainer = styled("div")({
  alignItems: "center",
  display: "flex",
});

const StyledHostRequestStatusIcon = styled(HostRequestStatusIcon)(
  ({ theme }) => ({
    marginInlineEnd: theme.spacing(1),
  }),
);

const StyledListItemContainer = styled("div")(() => ({
  position: "relative",
  width: "100%",
}));

const StyledMenuContainer = styled("div")(() => ({
  position: "absolute",
  bottom: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 1,
}));

const StyledDateAndBadgeContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexWrap: "nowrap",
  overflow: "hidden",
}));

const RequestTypeChip = styled(Chip)<{ ishost: "true" | "false" }>(
  ({ theme, ishost }) => ({
    height: 20,
    fontSize: "0.75rem",
    fontWeight: 500,
    flexShrink: 0,
    backgroundColor:
      ishost === "true" ? "rgba(0, 163, 152, 0.1)" : "rgba(255, 138, 0, 0.1)",
    color: ishost === "true" ? "var(--mui-palette-primary-main)" : "#FF8A00",
    "& .MuiChip-label": {
      padding: theme.spacing(0, 1),
    },
    [theme.breakpoints.down("sm")]: {
      height: 18,
      fontSize: "0.65rem",
      "& .MuiChip-label": {
        padding: theme.spacing(0, 0.5),
      },
    },
  }),
);

interface HostRequestListItemProps {
  hostRequest: HostRequest.AsObject;
  className?: string;
  isArchived?: boolean;
}

export default function HostRequestListItem({
  hostRequest,
  className,
  isArchived = false,
}: HostRequestListItemProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(MESSAGES);
  const { authState } = useAuthContext();
  const isHost = authState.userId === hostRequest.hostUserId;
  const { data: currentUser } = useCurrentUser();
  const { data: otherUser, isLoading: isOtherUserLoading } = useLiteUser(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId,
  );
  const isUnread = hasUnreadMessages(hostRequest);
  //define the latest message author's name and
  //control message target to use in short message preview
  const authorName =
    hostRequest?.latestMessage?.authorUserId === authState.userId
      ? firstName(currentUser?.name) || ""
      : firstName(otherUser?.name) || "";

  const targetName = hostRequest?.latestMessage
    ? messageTargetId(hostRequest.latestMessage) === authState.userId
      ? firstName(currentUser?.name) || ""
      : firstName(otherUser?.name) || ""
    : "";

  //text is the control message text or message text, truncated
  const latestMessageText = hostRequest.latestMessage
    ? isControlMessage(hostRequest.latestMessage)
      ? controlMessage({
          message: hostRequest.latestMessage,
          user: authorName,
          target_user: targetName,
          t,
        })
      : //if it's a normal message, show "<User's Name>: <The message>"
        `${capitalize(authorName)}: ${
          hostRequest.latestMessage.text?.text || ""
        }`
    : "";

  const isPast = dayjs(hostRequest?.toDate).isBefore(dayjs(), "day");

  const queryClient = useQueryClient();

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setMenuAnchorEl(null);
  };

  const archiveMutation = useMutation<void, RpcError>({
    mutationFn: async () => {
      await service.requests.setHostRequestArchiveStatus(
        hostRequest.hostRequestId,
        !isArchived,
      );
    },
    onMutate: async () => {
      handleMenuClose();
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: hostRequestsListKey() });
    },
    onSettled: () => {
      // Refetch after mutation completes (success or error)
      queryClient.invalidateQueries({ queryKey: hostRequestsListKey() });
    },
  });

  const menuItems: EllipsisMenuItem[] = [
    {
      icon: isArchived ? UnarchiveOutlined : ArchiveOutlined,
      label: isArchived
        ? t("archive.unarchive_button")
        : t("archive.archive_button"),
      onClick: () => {
        archiveMutation.mutate();
      },
    },
  ];

  return (
    <StyledListItemContainer>
      <ListItem
        className={className}
        sx={{ color: isPast ? "grey.500" : "text.primary", paddingRight: 7 }}
      >
        <ListItemAvatar>
          <Avatar user={otherUser} isProfileLink={false} />
        </ListItemAvatar>
        <ListItemText
          sx={{ paddingRight: 5 }}
          disableTypography
          primary={
            <Typography
              variant="h2"
              sx={isPast && isUnread ? { color: "text.primary" } : undefined}
            >
              {!otherUser ? <Skeleton width={100} /> : otherUser.name}
            </Typography>
          }
          secondary={
            <>
              <StyledHostStatusContainer>
                <StyledHostRequestStatusIcon hostRequest={hostRequest} />
                {isOtherUserLoading ? (
                  <Skeleton width={200} />
                ) : (
                  <HostRequestStatusText
                    isHost={isHost}
                    requestStatus={hostRequest.status}
                    isPast={isPast}
                  />
                )}
              </StyledHostStatusContainer>
              <StyledDateAndBadgeContainer>
                <Typography component="div" display="inline" variant="h3">
                  {localizeDateTimeRange(
                    // Host request are plain dates (no time),
                    // just make sure to parse and format them in the same timezone.
                    dayjs.tz(hostRequest.fromDate, UTC_TIMEZONE),
                    dayjs.tz(hostRequest.toDate, UTC_TIMEZONE),
                    {
                      timezone: UTC_TIMEZONE,
                      locale,
                      includeTime: false,
                    },
                  )}
                </Typography>
                <RequestTypeChip
                  label={
                    isHost
                      ? t("messages_page.tabs.hosting")
                      : t("messages_page.tabs.surfing")
                  }
                  ishost={isHost ? "true" : "false"}
                  size="small"
                />
              </StyledDateAndBadgeContainer>
              <TextBody
                noWrap
                sx={{
                  fontWeight: isUnread ? "bold" : "normal",
                  ...(isPast && isUnread ? { color: "text.primary" } : {}),
                }}
              >
                {isOtherUserLoading ? (
                  <Skeleton width={100} />
                ) : (
                  latestMessageText
                )}
              </TextBody>
            </>
          }
        />
      </ListItem>
      <StyledMenuContainer>
        <EllipsisMenu
          idName={`host-request-${hostRequest.hostRequestId}`}
          isMenuOpen={!!menuAnchorEl}
          menuAnchorEl={menuAnchorEl}
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
          items={menuItems}
        />
      </StyledMenuContainer>
    </StyledListItemContainer>
  );
}
