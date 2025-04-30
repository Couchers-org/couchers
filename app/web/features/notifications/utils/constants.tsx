import {
  AccountCircleRounded,
  BadgeRounded,
  ChatRounded,
  EditRounded,
  EmailRounded,
  EventRounded,
  InfoRounded,
  LockResetRounded,
  ManageAccountsRounded,
  MonetizationOnRounded,
  VerifiedUser,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import {
  AccountSecurityIcon,
  AccountSettingsIcon,
  ChatBubbleIcon,
  CommentIcon,
  CouchFilledIcon,
  EventIcon,
  PenIcon,
  SegmentIcon,
  SinglePersonIcon,
} from "components/Icons";
import { theme } from "theme";

const mapNotificationSettingsTypeToIcon: { [key: string]: JSX.Element } = {
  account_security: <AccountSecurityIcon fontSize="large" color="action" />,
  account_settings: <AccountSettingsIcon fontSize="large" color="action" />,
  chat: <ChatBubbleIcon fontSize="large" color="action" />,
  event: <EventIcon fontSize="large" color="action" />,
  reference: <PenIcon fontSize="large" color="action" />,
  friend_request: <SinglePersonIcon fontSize="large" color="action" />,
  host_request: <CouchFilledIcon fontSize="large" color="action" />,
  discussion: <CommentIcon fontSize="large" color="action" />,
  reply: <SegmentIcon fontSize="large" color="action" />,
};

const mapNotificationFeedTypeToIcon: { [key: string]: JSX.Element } = {
  account_deletion: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  badge: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <BadgeRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  birthdate: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  chat: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <EmailRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  discussion: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ChatRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  donation: (
    <Box
      sx={{
        backgroundColor: theme.palette.common.white,
        width: theme.spacing(2),
        height: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <MonetizationOnRounded
        sx={{
          color: theme.palette.primary.main,
        }}
      />
    </Box>
  ),
  email_address: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  event: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <EventRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "1rem",
        }}
      />
    </Box>
  ),
  friend_request: (
    <Box
      sx={{
        backgroundColor: theme.palette.common.white,
        width: theme.spacing(2),
        height: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <AccountCircleRounded
        sx={{
          color: theme.palette.primary.main,
        }}
      />
    </Box>
  ),
  gender: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  host_request: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <CouchFilledIcon
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  modnote: (
    <Box
      sx={{
        backgroundColor: theme.palette.common.white,
        width: theme.spacing(2),
        height: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <InfoRounded
        sx={{
          color: theme.palette.primary.main,
        }}
      />
    </Box>
  ),
  onboarding: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  password: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  password_reset: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <LockResetRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "1.1rem",
        }}
      />
    </Box>
  ),
  phone_number: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ManageAccountsRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  reference: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <EditRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  thread: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <ChatRounded
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
  verification: (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        width: theme.spacing(2.5),
        height: theme.spacing(2.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
      }}
    >
      <VerifiedUser
        sx={{
          color: theme.palette.common.white,
          fontSize: "0.9rem",
        }}
      />
    </Box>
  ),
};

export { mapNotificationFeedTypeToIcon, mapNotificationSettingsTypeToIcon };
