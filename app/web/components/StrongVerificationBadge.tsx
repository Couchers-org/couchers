import { VerifiedUser } from "@mui/icons-material";
import { Tooltip, styled } from "@mui/material";
import React from "react";

import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";

const StyledSpan = styled("span")(({ theme }) => ({
  display: "inline-block",
  verticalAlign: "middle",
  marginLeft: theme.spacing(0.5),
}));

const StrongVerificationBadge = () => {
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
};

export default StrongVerificationBadge;
