import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography } from "@mui/material";
import Button from "components/Button";
import IconButton from "components/IconButton";
import Link from "next/link";

export default function ReminderItem() {
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
            description description description description description
            description description
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
          button Text
        </Button>
      </Box>

      {/* Card 2 */}
      {/* <Box
        sx={{
          backgroundColor: "#FFF4E6",
          padding: "24px",
          position: "relative",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "325px",
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label="close"
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
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#333",
              lineHeight: 1.2,
              marginBottom: "16px",
              fontSize: "1.5rem",
            }}
          >
            placeholder title 2
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#444",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            description description description description description
            description description
          </Typography>
        </Box>

        <Button
          component={Link}
          href={"href"}
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: "primary",
            color: "text.primary",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "10px 0",
          }}
        >
          button Text
        </Button>
      </Box> */}
    </Box>
  );
}
