import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { remindersKey } from "app/web/features/queryKeys";
import Alert from "components/Alert";
import IconButton from "components/IconButton";
import { RpcError } from "grpc-web";
import { GetRemindersRes } from "proto/account_pb";
import { useState } from "react";
import { service } from "service";

import ReminderItem from "./ReminderItem";

export default function ReminderCarousel() {
  const { data, error } = useQuery<GetRemindersRes.AsObject, RpcError>({
    queryKey: [remindersKey],
    queryFn: () => service.account.getReminders(),
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const reminders = data?.remindersList || [];

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, reminders.length - 1));
  };

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < reminders.length - 1;

  return (
    <>
      {error && <Alert severity="error">{error?.message}</Alert>}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          aria-label="left arrow"
          onClick={handlePrev}
          disabled={!canGoLeft}
          sx={{
            backgroundColor: "var(--mui-palette-background-paper)",
            color: "var(--mui-palette-text-primary)",
            borderRadius: "50%",
            "&:hover": {
              backgroundColor: "var(--mui-palette-primary-dark)",
            },
            "&:disabled": {
              backgroundColor: "var(--mui-palette-grey-300)",
              color: "var(--mui-palette-grey-600)",
            },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: "transform 0.3s ease",
            }}
          >
            {reminders.map((reminder, i) => (
              <Box key={i} sx={{ minWidth: "100%", flexShrink: 0 }}>
                <ReminderItem data={reminder} />
              </Box>
            ))}
          </Box>
        </Box>

        <IconButton
          aria-label="right arrow"
          onClick={handleNext}
          disabled={!canGoRight}
          sx={{
            backgroundColor: "var(--mui-palette-background-paper)",
            color: "var(--mui-palette-text-primary)",
            borderRadius: "50%",
            "&:hover": {
              backgroundColor: "var(--mui-palette-primary-dark)",
            },
            "&:disabled": {
              backgroundColor: "var(--mui-palette-grey-300)",
              color: "var(--mui-palette-grey-600)",
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </>
  );
}
