import { styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { Trans } from "i18n";
import { HostRequestStatus } from "proto/conversations_pb";
import React from "react";
import { howToRespondRequestGuideUrl, howToWriteRequestGuideUrl } from "routes";

const StyledHelpTextContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
}));

export default function HostRequestGuideLinks({
  isPast,
  isHost,
  status,
}: {
  isPast: boolean;
  isHost: boolean;
  status: HostRequestStatus;
}) {
  const isHostPending =
    !isPast &&
    isHost &&
    status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING;

  const isSurferRejected =
    !isHost && status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

  if (isHostPending) {
    return (
      <StyledHelpTextContainer>
        <Typography variant="body1">
          <Trans i18nKey="messages:host_pending_request_help_text">
            <StyledLink variant="body1" href={howToRespondRequestGuideUrl}>
              Things to consider
            </StyledLink>{" "}
            before responding.
          </Trans>
        </Typography>
      </StyledHelpTextContainer>
    );
  } else if (isSurferRejected) {
    return (
      <StyledHelpTextContainer>
        <Typography variant="body1">
          <Trans i18nKey="messages:surfer_declined_request_help_text">
            <StyledLink variant="body1" href={howToWriteRequestGuideUrl}>
              Read our guide
            </StyledLink>{" "}
            on how to write a request that will get accepted.
          </Trans>
        </Typography>
      </StyledHelpTextContainer>
    );
  } else {
    return null;
  }
}
