import { Card, CardContent, Skeleton, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import Linkify from "components/Linkify";
import TextBody from "components/TextBody";
import FlagButton from "features/FlagButton";
import TimeInterval from "features/messages/messagelist/TimeInterval";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { Message } from "proto/conversations_pb";
import { timestamp2Date } from "utils/date";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

export const messageElementId = (id: number) => `message-${id}`;

const RootContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "isCurrentUser" && prop !== "isLoading",
})<{ isCurrentUser: boolean; isLoading: boolean }>(
  ({ theme, isCurrentUser, isLoading }) => ({
    "& > :first-of-type": { marginRight: theme.spacing(2) },
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
    [theme.breakpoints.up("xs")]: {
      width: "100%",
    },
    [theme.breakpoints.up("sm")]: {
      width: "80%",
    },
    [theme.breakpoints.up("md")]: {
      width: "70%",
    },
    border: "1px solid",
    borderRadius: theme.shape.borderRadius * 3,

    ...(isLoading && {
      borderColor: theme.palette.text.secondary,
    }),

    ...(isCurrentUser &&
      !isLoading && {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
      }),

    ...(!isCurrentUser &&
      !isLoading && {
        borderColor: theme.palette.grey[300],
        backgroundColor: theme.palette.grey[200],
      }),
  }),
);

const StyledLeftOfMessage = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const StyledHeader = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(1),
}));

const StyledNameTypography = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  flexGrow: 1,
  fontWeight: "bold",
  margin: 0,
}));

const StyledMessageBody = styled(CardContent)(({ theme }) => ({
  "&:last-of-type": { paddingBottom: theme.spacing(2) },

  paddingBottom: theme.spacing(1),
  paddingTop: 0,
  overflowWrap: "break-word",
  whiteSpace: "pre-wrap",
}));

const StyledFooter = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  paddingBottom: theme.spacing(2),
  paddingInlineEnd: theme.spacing(2),
  paddingInlineStart: theme.spacing(2),
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
          <StyledAvatar user={author} />
          <FlagButton
            contentRef={`chat/message/${message.messageId}`}
            authorUser={author.userId}
          />
        </StyledLeftOfMessage>
      )}
      <StyledCard isLoading={isLoading} isCurrentUser={isCurrentUser}>
        <StyledHeader>
          {author ? (
            <StyledNameTypography variant="h5">
              {author.name}
            </StyledNameTypography>
          ) : (
            <Skeleton width={100} />
          )}
          {!isCurrentUser && (
            <TimeInterval date={timestamp2Date(message.time!)} />
          )}
        </StyledHeader>

        <StyledMessageBody>
          <TextBody>
            <Linkify
              text={message.text?.text || ""}
              isCurrentUser={isCurrentUser}
            />
          </TextBody>
        </StyledMessageBody>

        {isCurrentUser && (
          <StyledFooter>
            <TimeInterval date={timestamp2Date(message.time!)} />
          </StyledFooter>
        )}
      </StyledCard>
      {author && isCurrentUser && <StyledAvatar user={author} />}
    </RootContainer>
  );
}
