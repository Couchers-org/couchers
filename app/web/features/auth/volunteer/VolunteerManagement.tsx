import { Typography } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetAccountInfoRes } from "proto/account_pb";
import { volunteerNotAVolunteerFormUrl } from "routes";
import { theme } from "theme";

import { useVolunteerInfo } from "./useVolunteerInfo";
import VolunteerCard from "./VolunteerCard";
import VolunteerForm from "./VolunteerForm";

type VolunteerManagementProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

export default function VolunteerManagement({ className, accountInfo }: VolunteerManagementProps) {
  const { t } = useTranslation([AUTH]);

  // Non-volunteer view
  if (!accountInfo.isVolunteer) {
    return (
      <div className={className} id="volunteer-management">
        <Typography variant="h2">{t("auth:volunteer_management.title")}</Typography>
        <Typography variant="body1" sx={{ marginTop: theme.spacing(1) }}>
          <Trans
            t={t}
            i18nKey="auth:volunteer_management.not_a_volunteer_message"
            components={{ formLink: <StyledLink href={volunteerNotAVolunteerFormUrl} /> }}
          />
        </Typography>
      </div>
    );
  }

  return <VolunteerManagementContent className={className} />;
}

function VolunteerManagementContent({ className }: { className?: string }) {
  const { t } = useTranslation([AUTH]);
  const { data: volunteerInfo, error: volunteerInfoError, isLoading: isVolunteerInfoLoading } = useVolunteerInfo();

  if (isVolunteerInfoLoading) {
    return (
      <div className={className} id="volunteer-management">
        <Typography variant="h2">{t("auth:volunteer_management.title")}</Typography>
        <CenteredSpinner />
      </div>
    );
  }

  if (volunteerInfoError) {
    return (
      <div className={className} id="volunteer-management">
        <Typography variant="h2">{t("auth:volunteer_management.title")}</Typography>
        <Alert severity="error">{volunteerInfoError.message}</Alert>
      </div>
    );
  }

  if (!volunteerInfo) {
    return null;
  }

  return (
    <div className={className} id="volunteer-management">
      <Typography variant="h2">{t("auth:volunteer_management.title")}</Typography>
      <Typography variant="body1" sx={{ marginTop: theme.spacing(1) }}>
        {t("auth:volunteer_management.description")}
      </Typography>

      <VolunteerCard volunteerInfo={volunteerInfo} />
      <VolunteerForm volunteerInfo={volunteerInfo} />
    </div>
  );
}
