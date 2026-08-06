import { Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { verificationRoute } from "routes";

/**
 * Signpost left behind in account settings after Strong Verification and phone
 * verification moved to their own page. The id keeps old #strong-verification
 * deep links landing on the pointer rather than nowhere.
 */
export default function VerificationLink() {
  const { t } = useTranslation(AUTH);

  return (
    <div id="strong-verification">
      <Typography variant="h2" gutterBottom>
        {t("verification_page.settings_link.title")}
      </Typography>
      <Typography variant="body1">
        <Trans
          t={t}
          i18nKey="verification_page.settings_link.moved_message"
          components={{ 1: <StyledLink href={verificationRoute} /> }}
        />
      </Typography>
    </div>
  );
}
