import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography } from "@mui/material";
import Button from "components/Button";
import IconButton from "components/IconButton";
import Link from "next/link";
import { useState } from "react";
import { theme } from "theme";

export default function ReminderItem() {
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
      <Box
        sx={{
          backgroundColor: theme.palette.warning.light,
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
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "var(--mui-palette-grey-400)",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "var(--mui-palette-text-primary)",
              lineHeight: 1.2,
              marginBottom: "16px",
              fontSize: "1.5rem",
            }}
          >
            Complete Your Profile
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "var(--mui-palette-grey-400)",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
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
            color: "var(--mui-palette-text-primary)",
          }}
        >
          Edit Your Profile
        </Button>
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.warning.light,
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
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "var(--mui-palette-text-primary)",
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
              color: "var(--mui-palette-text-primary)",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            Verify your identity for a safer community.
          </Typography>
        </Box>

        <Button
          component={Link}
          fullWidth
          variant="contained"
          color="primary"
          sx={{
            fontWeight: 700,
            borderRadius: "8px",
            padding: "10px 0",
            color: "var(--mui-palette-text-primary)",
          }}
        >
          Verify your account
        </Button>
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.warning.light,
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
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "var(--mui-palette-text-primary)",
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
              color: "var(--mui-palette-text-primary)",
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
            color: "var(--mui-palette-text-primary)",
          }}
        >
          Verify your account
        </Button>
      </Box>
    </Box>
  );
}
