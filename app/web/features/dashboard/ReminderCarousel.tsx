import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import IconButton from "components/IconButton";
import { RpcError } from "grpc-web";
import { GetRemindersRes } from "proto/account_pb";
import { useState } from "react";
import { service } from "service";

import ReminderItem from "./ReminderItem";

export default function ReminderCarousel() {
  const { data, error } = useQuery<GetRemindersRes.AsObject, RpcError>({
    queryKey: ["reminders"],
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

  console.log("reminders data:", data);
  console.log("reminders error:", error);

  return (
    <>
      {error && <Alert severity="error">{error?.message}</Alert>}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Left Arrow */}
        <IconButton
          aria-label="left arrow"
          onClick={handlePrev}
          disabled={!canGoLeft}
          sx={{
            backgroundColor: "primary.main",
            color: "text.primary",
            borderRadius: "50%",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
            "&:disabled": {
              backgroundColor: "grey.300",
              color: "grey.600",
            },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Reminder Cards Container */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <ReminderItem />
        </Box>

        {/* Right Arrow */}
        <IconButton
          aria-label="right arrow"
          onClick={handleNext}
          disabled={!canGoRight}
          sx={{
            backgroundColor: "primary.main",
            color: "text.primary",
            borderRadius: "50%",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
            "&:disabled": {
              backgroundColor: "grey.300",
              color: "grey.600",
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
      {/* <ReminderItem reminder={reminder} /> */}
      {/* {data &&
        Object.values(data)
          .filter(Boolean)
          .map((reminder, index) => (
          ))} */}
    </>
  );
}
