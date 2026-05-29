import { Card, CardContent, Skeleton, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import Linkify from "components/Linkify";
import TextBody from "components/TextBody";
import FlagButton from "features/FlagButton";
import TimeInterval from "features/messages/messagelist/TimeInterval";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { Message } from "proto/conversations_pb";
import { timestamp2Date } from "utils/date";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

export const messageElementId = (id: number) => `message-${id}`;

const RootContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "isCurrentUser" && prop !== "isLoading",
})<{ isCurrentUser: boolean; isLoading: boolean }>(
  ({ theme, isCurrentUser, isLoading }) => ({
    display: "flex",

    ...(isLoading && {
      justifyContent: "center",
    }),

    ...(isCurrentUser && !isLoading && { justifyContent: "flex-end" }),

    ...(!isCurrentUser && !isLoading && { justifyContent: "flex-start" }),
  }),
);

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  height: 40,
  width: 40,
}));

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isLoading" && prop !== "isCurrentUser",
})<{ isLoading: boolean; isCurrentUser: boolean }>(
  ({ theme, isCurrentUser, isLoading }) => ({
    width: "fit-content",
    minWidth: 0,
    [theme.breakpoints.up("xs")]: {
      maxWidth: "100%",
    },
    [theme.breakpoints.up("sm")]: {
      maxWidth: "80%",
    },
    [theme.breakpoints.up("md")]: {
      maxWidth: "min(70%, 75rem)",
    },
    border: "1px solid",
    borderRadius: theme.shape.borderRadius * 3,

    ...(isLoading && {
      borderColor: "var(--mui-palette-text-secondary)",
    }),

    ...(isCurrentUser &&
      !isLoading && {
        borderColor: "var(--mui-palette-primary-main)",
        backgroundColor: "var(--mui-palette-primary-main)",
        color: "var(--mui-palette-common-white)",
      }),

    ...(!isCurrentUser &&
      !isLoading && {
        borderColor: "var(--mui-palette-grey-300)",
        backgroundColor: "var(--mui-palette-grey-200)",
      }),
  }),
);

const StyledLeftOfMessage = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginRight: theme.spacing(2),
}));

const StyledHeader = styled("div", {
  shouldForwardProp: (prop) => prop !== "isCurrentUser",
})<{ isCurrentUser: boolean }>(({ theme, isCurrentUser }) => ({
  alignItems: "baseline",
  display: "flex",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(1),

  ...(isCurrentUser && { justifyContent: "flex-end" }),
}));

const StyledNameTypography = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  flexGrow: 1,
  minWidth: 0,
  fontWeight: "bold",
  margin: 0,
}));

const StyledTimeInterval = styled(TimeInterval)({
  flexShrink: 0,
  whiteSpace: "nowrap",
});

const StyledMessageBody = styled(CardContent)(({ theme }) => ({
  "&:last-of-type": { paddingBottom: theme.spacing(2) },

  paddingBottom: theme.spacing(1),
  paddingTop: 0,
  overflowWrap: "break-word",
  whiteSpace: "pre-wrap",
}));

export interface MessageProps {
  message: Message.AsObject;
  onVisible?(): void;
  className?: string;
}

export default function MessageView({
  className,
  message,
  onVisible,
}: MessageProps) {
  const { t } = useTranslation(MESSAGES);

  const { data: author, isLoading: isAuthorLoading } = useLiteUser(
    message.authorUserId,
  );
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useCurrentUser();
  const isLoading = isAuthorLoading || isCurrentUserLoading;
  const isCurrentUser = author?.userId === currentUser?.userId;

  const { ref } = useOnVisibleEffect(onVisible);

  return (
    <RootContainer
      className={className}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      id={messageElementId(message.messageId)}
      isCurrentUser={isCurrentUser}
      isLoading={isLoading}
    >
      {author && !isCurrentUser && (
        <StyledLeftOfMessage>
          {author && !isAuthorLoading && <StyledAvatar user={author} />}
          {isAuthorLoading && (
            <Skeleton variant="rounded" width={40} height={40} />
          )}
          {!author && !isAuthorLoading && <StyledAvatar />}
          <FlagButton
            contentRef={`chat/message/${message.messageId}`}
            authorUser={author.userId}
          />
        </StyledLeftOfMessage>
      )}
      <StyledCard isLoading={isLoading} isCurrentUser={isCurrentUser}>
        <StyledHeader isCurrentUser={isCurrentUser}>
          {!isCurrentUser && author && !isAuthorLoading && (
            <StyledNameTypography variant="h5">
              {author.name}
            </StyledNameTypography>
          )}
          {!isCurrentUser && isAuthorLoading && <Skeleton width={100} />}
          {!isCurrentUser && !author && !isAuthorLoading && (
            <StyledNameTypography variant="h5">
              {t("unknown_user")}
            </StyledNameTypography>
          )}
          <StyledTimeInterval date={timestamp2Date(message.time!)} />
        </StyledHeader>
        <StyledMessageBody>
          <TextBody>
            <Linkify
              text={message.text?.text || ""}
              isCurrentUser={isCurrentUser}
            />
          </TextBody>
        </StyledMessageBody>
      </StyledCard>
    </RootContainer>
  );
}
