import { Box, styled, Typography } from "@mui/material";
import Button from "components/Button";
import { useAuthContext } from "features/auth/AuthProvider";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { HostRequestStatus } from "proto/conversations_pb";
import { ReferenceType } from "proto/references_pb";
import { HostRequest } from "proto/requests_pb";
import { referenceTypeRoute, routeToLeaveReference } from "routes";

const StyledCard = styled(Box)(({ theme }) => ({
  background: "var(--mui-palette-grey-50)",
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  alignSelf: "flex-start",
}));

const StyledButtonRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
}));

export default function HostRequestReferenceCard({
  hostRequest,
}: {
  hostRequest: HostRequest.AsObject;
}) {
  const { t } = useTranslation(MESSAGES);
  const { authState } = useAuthContext();

  const isHost = hostRequest.hostUserId === authState.userId;

  const { data: availableReferences } = useListAvailableReferences(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId,
  );

  const isReferenceAvailable =
    (hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED ||
      hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) &&
    availableReferences?.availableWriteReferencesList.find(
      ({ hostRequestId }) => hostRequestId === hostRequest.hostRequestId,
    );

  if (!isReferenceAvailable) return null;

  const referenceRoute = routeToLeaveReference(
    referenceTypeRoute[
      isHost
        ? ReferenceType.REFERENCE_TYPE_HOSTED
        : ReferenceType.REFERENCE_TYPE_SURFED
    ],
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId,
    hostRequest.hostRequestId,
  );

  return (
    <StyledCard>
      <div>
        <Typography variant="subtitle2">{t("reference_card.title")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("reference_card.description")}
        </Typography>
      </div>
      <StyledButtonRow>
        <Button component={Link} href={referenceRoute}>
          {t("write_reference_button_text")}
        </Button>
      </StyledButtonRow>
    </StyledCard>
  );
}
