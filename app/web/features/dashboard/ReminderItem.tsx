// interface ReminderItemProps {
//   reminder: any;
// }

import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography } from "@mui/material";
import Button from "components/Button";
import IconButton from "components/IconButton";
import Link from "next/link";

export default function ReminderItem() {
  // { reminder }: ReminderItemProps
  return (
    <>
      {/* {JSON.stringify(reminder)}
      <div>{reminder}</div> */}
      <Box
        sx={{
          backgroundColor: "#FFF4E6",
          padding: "24px",
          position: "relative",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
        }}
      >
        <IconButton
          // onClick={onClose}
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
            title
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#444",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            description
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
      </Box>
    </>
  );
}
