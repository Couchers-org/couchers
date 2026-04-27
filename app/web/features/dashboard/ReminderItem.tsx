import { Box, Typography, useColorScheme } from "@mui/material";
import { useMediaQuery } from "@mui/system";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { Reminder } from "proto/account_pb";
import {
  referenceTypeRoute,
  routeToEditProfile,
  routeToHostRequest,
  routeToLeaveReference,
  strongVerificationRoute,
} from "routes";

import { theme } from "../../theme";

export default function ReminderItem({
  reminder,
}: {
  reminder: Reminder.AsObject;
}) {
  const { t } = useTranslation([DASHBOARD]);
  const { mode, systemMode } = useColorScheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const resolvedMode = mode === "system" ? systemMode : mode;
  const isDark = resolvedMode === "dark";

  let title: string;
  let description: string;
  let buttonText: string;
  let href: string;

  if (reminder.respondToHostRequestReminder) {
    const { hostRequestId, surferUser } = reminder.respondToHostRequestReminder;
    title = t("reminder.respond_to_host_request.title");
    description = t("reminder.respond_to_host_request.description", {
      name: surferUser?.name ?? "",
    });
    buttonText = t("reminder.respond_to_host_request.button");
    href = routeToHostRequest(hostRequestId);
  } else if (reminder.writeReferenceReminder?.otherUser) {
    const { hostRequestId, otherUser, referenceType } =
      reminder.writeReferenceReminder;
    title = t("reminder.write_reference.title");
    description = t("reminder.write_reference.description", {
      name: otherUser.name,
    });
    buttonText = t("reminder.write_reference.button");
    href = routeToLeaveReference(
      referenceTypeRoute[referenceType],
      otherUser.userId,
      hostRequestId,
    );
  } else if (reminder.completeProfileReminder) {
    title = t("reminder.complete_profile.title");
    description = t("reminder.complete_profile.description");
    buttonText = t("reminder.complete_profile.button");
    href = routeToEditProfile();
  } else if (reminder.completeVerificationReminder) {
    title = t("reminder.strong_verification.title");
    description = t("reminder.strong_verification.description");
    buttonText = t("reminder.strong_verification.button");
    href = strongVerificationRoute;
  } else {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: isDark ? "#716317" : "#fff5e4",
        padding: isMobile ? "20px" : "24px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      })}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            marginBottom: isMobile ? "12px" : "16px",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            marginBottom: isMobile ? "14px" : "18px",
            fontSize: ".85rem",
          }}
        >
          {description}
        </Typography>
      </Box>

      <Button
        component={Link}
        href={href}
        fullWidth
        variant="contained"
        size={isMobile ? "small" : "medium"}
        sx={{
          fontWeight: 700,
          borderRadius: "8px",
        }}
      >
        {buttonText}
      </Button>
    </Box>
  );
}
