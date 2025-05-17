import { styled, Typography } from "@mui/material";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { referenceTypeRoute } from "routes";
import { theme } from "theme";

export interface ReferenceStepHeaderProps {
  name?: string;
  referenceType?: string;
  isSubmitStep?: boolean;
  isDidStayStep?: boolean;
}

const StyledHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export default function ReferenceStepHeader({
  name,
  referenceType,
  isSubmitStep = false,
  isDidStayStep = false,
}: ReferenceStepHeaderProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const router = useRouter();

  return (
    <StyledHeader>
      <HeaderButton
        onClick={() => router.back()}
        aria-label={t("profile:leave_reference.previous_step")}
      >
        <BackIcon />
      </HeaderButton>
      <Typography variant="h2" sx={{ marginInlineStart: theme.spacing(2) }}>
        {isSubmitStep
          ? t("profile:leave_reference.reference_submit_heading")
          : isDidStayStep
            ? t("profile:leave_reference.reference_form_heading_did_stay", {
                name,
              })
            : referenceType ===
                referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
              ? t("profile:leave_reference.reference_form_heading_friend", {
                  name,
                })
              : referenceType ===
                  referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED]
                ? t("profile:leave_reference.reference_form_heading_surfed", {
                    name,
                  })
                : t("profile:leave_reference.reference_form_heading_hosted", {
                    name,
                  })}
      </Typography>
    </StyledHeader>
  );
}
