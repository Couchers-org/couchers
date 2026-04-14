import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography } from "@mui/material";
import Button from "components/Button";
import IconButton from "components/IconButton";
import Link from "next/link";
import { useMemo, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
};

type ReminderItemProps = {
  data?: Reminder[];
};

export default function ReminderItem({ data = [] }: ReminderItemProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleReminders = useMemo(() => {
    return data.filter((item) => !dismissedIds.includes(item.id));
  }, [data, dismissedIds]);

  const handleClose = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  if (!visibleReminders.length) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflow: "auto",
      }}
    >
      {visibleReminders.map((item) => (
        <Box
          key={item.id}
          sx={{
            backgroundColor: "var(--mui-palette-warning-light)",
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
            onClick={() => handleClose(item.id)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "var(--mui-palette-grey-500)",
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
              {item.title}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "var(--mui-palette-text-primary)",
                lineHeight: 1.5,
                marginBottom: "24px",
              }}
            >
              {item.description}
            </Typography>
          </Box>

          <Button
            component={Link}
            href={item.href}
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
            {item.buttonText}
          </Button>
        </Box>
      ))}
    </Box>
  );
}
