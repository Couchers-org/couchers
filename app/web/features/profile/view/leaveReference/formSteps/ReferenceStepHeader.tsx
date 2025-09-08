import { Typography, styled } from "@mui/material";
import { useRouter } from "next/router";

import HeaderButton from "@/components/HeaderButton";
import { BackIcon } from "@/components/Icons";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { ReferenceType } from "@/proto/references_pb";
import { REFERENCE_TYPE_ROUTE } from "@/routes";
import { theme } from "@/theme";

export interface ReferenceStepHeaderProps {
  name?: string;
  referenceType?: string;
  isSubmitStep?: boolean;
  isDidStayStep?: boolean;
}

const StyledHeader = styled("div")({
  display: "flex",
  alignItems: "center",
});

const ReferenceStepHeader = ({
  name,
  referenceType,
  isSubmitStep = false,
  isDidStayStep = false,
}: ReferenceStepHeaderProps) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const router = useRouter();

  const returnHeaderText = () => {
    if (isSubmitStep) {
      return t("profile:leave_reference.reference_submit_heading");
    }

    if (isDidStayStep) {
      return referenceType ===
        REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_SURFED]
        ? t("profile:leave_reference.reference_form_heading_did_stay_surfed", {
            name,
          })
        : t("profile:leave_reference.reference_form_heading_did_stay_hosted", {
            name,
          });
    }
    if (
      referenceType ===
      REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      return t("profile:leave_reference.reference_form_heading_friend", {
        name,
      });
    }
    if (
      referenceType ===
      REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_SURFED]
    ) {
      return t("profile:leave_reference.reference_form_heading_surfed", {
        name,
      });
    }
    return t("profile:leave_reference.reference_form_heading_hosted", {
      name,
    });
  };

  return (
    <StyledHeader>
      <HeaderButton
        onClick={() => {
          router.back();
        }}
        aria-label={t("profile:leave_reference.previous_step")}
      >
        <BackIcon />
      </HeaderButton>
      <Typography variant="h2" sx={{ marginInlineStart: theme.spacing(2) }}>
        {returnHeaderText()}
      </Typography>
    </StyledHeader>
  );
};

export default ReferenceStepHeader;
