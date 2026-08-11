import { Card, CardContent, Skeleton, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import Linkify from "components/Linkify";
import RelativeTime from "components/RelativeTime";
import TextBody from "components/TextBody";
import { contentRefs } from "features/contentRefs";
import FlagButton from "features/FlagButton";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { Message } from "proto/messages_pb";
import { timestampToInstant } from "utils/date";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

export const messageElementId = (id: number) => `message-${id}`;

// Shared so the alignment cap can offset for it
const AVATAR_SIZE = 40;

const RootContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "isCurrentUser" && prop !== "isLoading",
})<{ isCurrentUser: boolean; isLoading: boolean }>(({ isCurrentUser }) => ({
  display: "flex",
  justifyContent: isCurrentUser ? "flex-end" : "flex-start",
}));

const StyledAvatar = styled(Avatar)(() => ({
  height: AVATAR_SIZE,
  width: AVATAR_SIZE,
}));

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isLoading" && prop !== "isCurrentUser" && prop !== "isDm",
})<{ isLoading: boolean; isCurrentUser: boolean; isDm: boolean }>(({ theme, isCurrentUser, isDm, isLoading }) => ({
  width: "fit-content",
  minWidth: 150,
  [theme.breakpoints.up("xs")]: {
    // Only group-chat received messages have a left (avatar) column to offset.
    maxWidth: !isCurrentUser && !isDm ? `calc(85% - ${AVATAR_SIZE}px - ${theme.spacing(1)})` : "85%",
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
}));

const StyledLeftOfMessage = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: AVATAR_SIZE,
  marginRight: theme.spacing(1),
}));

const StyledHeader = styled("div")(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(1),
  paddingBottom: theme.spacing(0.5),
}));

const StyledNameTypography = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  minWidth: 0,
  fontWeight: "bold",
  margin: 0,
}));

const StyledRelativeTime = styled(RelativeTime)(({ theme }) => ({
  ...theme.typography.caption,
  fontSize: "0.75rem", // 12px
  flexShrink: 0,
  whiteSpace: "nowrap",
}));

const StyledMessageBody = styled(CardContent)(({ theme }) => ({
  paddingTop: 0,
  paddingInline: theme.spacing(1),
  paddingBottom: theme.spacing(0.5),
  overflowWrap: "break-word",
  whiteSpace: "pre-wrap",

  // No header (own + 1:1 messages): restore top padding so text isn't flush to the top.
  "&:first-of-type": {
    paddingTop: theme.spacing(1),
  },
}));

const StyledFooter = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(0.25),
  paddingInline: theme.spacing(1),
  paddingBottom: theme.spacing(0.5),
}));

const StyledFlagButton = styled(FlagButton)(({ theme }) => ({
  padding: theme.spacing(0.25),
  color: "var(--mui-palette-primary-main)",
  "& svg": {
    fontSize: "1rem",
  },
  "&:hover, &:focus-visible": {
    color: "var(--mui-palette-primary-dark)",
  },
}));

export interface MessageProps {
  message: Message.AsObject;
  onVisible?(): void;
  className?: string;
  isDm?: boolean;
}

export default function MessageView({ className, message, onVisible, isDm = false }: MessageProps) {
  const { t } = useTranslation(MESSAGES);

  const { data: author, isLoading: isAuthorLoading } = useLiteUser(message.authorUserId);
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const isLoading = isAuthorLoading || isCurrentUserLoading;
  const isCurrentUser = message.authorUserId === currentUser?.userId;

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
      {author && !isCurrentUser && !isDm && (
        <StyledLeftOfMessage>
          {isAuthorLoading ? <Skeleton variant="rounded" width={40} height={40} /> : <StyledAvatar user={author} />}
        </StyledLeftOfMessage>
      )}
      <StyledCard isLoading={isLoading} isCurrentUser={isCurrentUser} isDm={isDm}>
        {!isCurrentUser && !isDm && (
          <StyledHeader>
            {isAuthorLoading ? (
              <Skeleton width={100} />
            ) : (
              <StyledNameTypography variant="h5">{author ? author.name : t("unknown_user")}</StyledNameTypography>
            )}
          </StyledHeader>
        )}
        <StyledMessageBody>
          <TextBody>
            <Linkify text={message.text?.text || ""} isCurrentUser={isCurrentUser} />
          </TextBody>
        </StyledMessageBody>
        <StyledFooter>
          <StyledRelativeTime instant={timestampToInstant(message.time!)} capitalize={true} />
          {author && !isCurrentUser && (
            <StyledFlagButton contentRef={contentRefs.chatMessage(message)} authorUser={author.userId} size="small" />
          )}
        </StyledFooter>
      </StyledCard>
    </RootContainer>
  );
}
