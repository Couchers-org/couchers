import { VerifiedUser } from "@mui/icons-material";
import { styled, Tooltip } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";

const StyledSpan = styled("span")(() => ({
  display: "inline-flex",
  alignItems: "center",
  verticalAlign: "middle",
}));

export default function StrongVerificationBadge() {
  const { t } = useTranslation(GLOBAL);

  return (
    <StyledSpan>
      <Tooltip title={t("strong_verification.helper_text")}>
        <VerifiedUser
          data-testid="strong-verification-id"
          fontSize="inherit"
          color="primary"
        />
      </Tooltip>
    </StyledSpan>
  );
}
