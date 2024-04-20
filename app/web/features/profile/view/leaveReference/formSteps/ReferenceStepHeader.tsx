import { Typography } from "@material-ui/core";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { referenceTypeRoute } from "routes";
import makeStyles from "utils/makeStyles";

export interface ReferenceStepHeaderProps {
  name?: string;
  referenceType?: string;
  isSubmitStep?: boolean;
}

const useStyles = makeStyles((theme) => ({
  header: {
    alignItems: "center",
    display: "flex",
  },
  title: {
    marginInlineStart: theme.spacing(2),
  },
}));

export default function ReferenceStepHeader({
  name,
  referenceType,
  isSubmitStep = false,
}: ReferenceStepHeaderProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const router = useRouter();
  const classes = useStyles();

  return (
    <div className={classes.header}>
      <HeaderButton
        onClick={() => router.back()}
        aria-label={t("profile:leave_reference.previous_step")}
      >
        <BackIcon />
      </HeaderButton>
      <Typography variant="h2" className={classes.title}>
        {isSubmitStep
          ? t("profile:leave_reference.reference_submit_heading")
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
    </div>
  );
}
