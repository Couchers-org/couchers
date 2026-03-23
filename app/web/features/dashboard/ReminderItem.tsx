import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography } from "@mui/material";
import Button from "components/Button";
import IconButton from "components/IconButton";
import Link from "next/link";
import { GetRemindersRes } from "proto/account_pb";
import { useState } from "react";

type Reminder = GetRemindersRes.AsObject["remindersList"][number];

type ReminderItemProps = {
  data: Reminder;
};

export default function ReminderItem({ data }: ReminderItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflow: "auto",
      }}
    >
      {/* {getReminders.map((reminder) =>
        closedReminders.has(reminder.id) ? null : ( */}
      <Box
        // key={reminder.id}
        sx={{
          backgroundColor: "#FFF4E6",
          padding: "24px",
          position: "relative",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label="close"
          // onClick={() => handleClose(reminder.id)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#A68966",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "#333",
              lineHeight: 1.2,
              marginBottom: "16px",
              fontSize: "1.5rem",
            }}
          >
            {/* {reminder.title} */}
            Complete Your Profile
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#444",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            {/* {reminder.description} */}
            Fill in your "Who I am" section and upload a profile photo.
          </Typography>
        </Box>

        <Button
          component={Link}
          href={"/profile/edit"}
          fullWidth
          variant="contained"
          color="primary"
          sx={{
            fontWeight: 700,
            borderRadius: "8px",
            padding: "10px 0",
            color: "text.primary",
          }}
        >
          {/* {reminder.buttonText} */}
          Edit Your Profile
        </Button>
      </Box>

      <Box
        sx={{
          backgroundColor: "#FFF4E6",
          padding: "24px",
          position: "relative",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#A68966",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "#333",
              lineHeight: 1.2,
              marginBottom: "16px",
              fontSize: "1.5rem",
            }}
          >
            Strong Verification
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#444",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            Verify your identity for a safer community.
          </Typography>
        </Box>

        <Button
          component={Link}
          href={"href"}
          fullWidth
          variant="contained"
          color="primary"
          sx={{
            fontWeight: 700,
            borderRadius: "8px",
            padding: "10px 0",
            color: "text.primary",
          }}
        >
          Verify your account
        </Button>
      </Box>

      <Box
        sx={{
          backgroundColor: "#FFF4E6",
          padding: "24px",
          position: "relative",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#A68966",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "#333",
              lineHeight: 1.2,
              marginBottom: "16px",
              fontSize: "1.5rem",
            }}
          >
            Strong Verification
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#444",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            Verify your identity for a safer community.
          </Typography>
        </Box>

        <Button
          component={Link}
          href={"href"}
          fullWidth
          variant="contained"
          color="primary"
          sx={{
            fontWeight: 700,
            borderRadius: "8px",
            padding: "10px 0",
            color: "text.primary",
          }}
        >
          Verify your account
        </Button>
      </Box>
    </Box>
  );
}
