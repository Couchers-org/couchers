import { Box, Typography, useColorScheme } from "@mui/material";
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

export default function ReminderItem({
  reminder,
}: {
  reminder: Reminder.AsObject;
}) {
  const { t } = useTranslation([DASHBOARD]);
  const { mode, systemMode } = useColorScheme();

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
        padding: "24px",
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      })}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: "16px",
            fontSize: "1.5rem",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.5,
            marginBottom: "24px",
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
        sx={{
          fontWeight: 700,
          borderRadius: "8px",
          padding: "10px 0",
        }}
      >
        {buttonText}
      </Button>
    </Box>
  );
}
