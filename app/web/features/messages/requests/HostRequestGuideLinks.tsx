import { Typography, styled } from "@mui/material";
import React from "react";

import StyledLink from "@/components/StyledLink";
import { Trans, useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import { HostRequestStatus } from "@/proto/conversations_pb";
import {
  HOW_TO_WRITE_REQUEST_GUIDE_URL,
  howToRespondRequestGuideUrl,
} from "@/routes";

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
  const { t } = useTranslation([MESSAGES]);

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
            <StyledLink variant="body1" href={HOW_TO_WRITE_REQUEST_GUIDE_URL}>
              Read our guide
            </StyledLink>{" "}
            on how to write a request that will get accepted.
          </Trans>
        </Typography>
      </StyledHelpTextContainer>
    );
  } else if (isPast) {
    return (
      <StyledHelpTextContainer>
        <Typography variant="body1">
          {t("messages:past_request_help_text")}
        </Typography>
      </StyledHelpTextContainer>
    );
  } else {
    return null;
  }
}
