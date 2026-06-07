import { alpha, Box, Typography } from "@mui/material";
import { useMediaQuery } from "@mui/system";
import Button from "components/Button";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { Reminder } from "proto/account_pb";
import { ReferenceType } from "proto/references_pb";
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
  onDismiss,
}: {
  reminder: Reminder.AsObject;
  onDismiss?: () => void;
}) {
  const { t } = useTranslation([DASHBOARD]);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  let title: string;
  let description: string;
  let buttonText: string;
  let href: string;

  if (reminder.respondToHostRequestReminder) {
    const { hostRequestId, surferUser } = reminder.respondToHostRequestReminder;
    const name = surferUser?.name ?? "";
    title = t("reminder.respond_to_host_request.title", { name });
    description = t("reminder.respond_to_host_request.description", { name });
    buttonText = t("reminder.respond_to_host_request.button");
    href = routeToHostRequest(hostRequestId);
  } else if (reminder.writeReferenceReminder?.otherUser) {
    const { hostRequestId, otherUser, referenceType } =
      reminder.writeReferenceReminder;
    title = t("reminder.write_reference.title");
    description = t(
      referenceType === ReferenceType.REFERENCE_TYPE_SURFED
        ? "reminder.write_reference.description_surfed"
        : "reminder.write_reference.description_hosted",
      { name: otherUser.name },
    );
    buttonText = t("reminder.write_reference.button");
    href = routeToLeaveReference(
      referenceTypeRoute[referenceType],
      otherUser.userId,
      hostRequestId,
    );
  } else if (reminder.confirmHostRequestReminder) {
    const { hostRequestId, hostUser } = reminder.confirmHostRequestReminder;
    const name = hostUser?.name ?? "";
    title = t("reminder.confirm_host_request.title", { name });
    description = t("reminder.confirm_host_request.description", { name });
    buttonText = t("reminder.confirm_host_request.button");
    href = routeToHostRequest(hostRequestId);
  } else if (reminder.completeMyHomeReminder) {
    title = t("reminder.complete_my_home.title");
    description = t("reminder.complete_my_home.description");
    buttonText = t("reminder.complete_my_home.button");
    href = routeToEditProfile("home");
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
        backgroundColor: alpha(theme.palette.secondary.main, 0.08),
        padding: isMobile ? "14px" : "24px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: isMobile ? "8px" : "16px",
        }}
      >
        <Typography
          variant={isMobile ? "h4" : "h3"}
          sx={{ fontWeight: 800, flexGrow: 1 }}
        >
          {title}
        </Typography>
        {onDismiss && (
          <IconButton
            aria-label={t("reminder.carousel_dismiss_button_a11y")}
            onClick={onDismiss}
            size="small"
            sx={{ marginTop: "-4px", marginRight: "-4px", flexShrink: 0 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Typography
        sx={{
          flexGrow: 1,
          marginBottom: isMobile ? "10px" : "18px",
          fontSize: isMobile ? ".75rem" : ".85rem",
        }}
      >
        {description}
      </Typography>

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
