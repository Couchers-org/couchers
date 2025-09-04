import { Typography } from "@mui/material";
import { useRouter } from "next/router";

import Button from "@/components/Button";
import StyledLink from "@/components/StyledLink";
import { Trans, useTranslation } from "@/i18n";
import { PROFILE } from "@/i18n/namespaces";
import { dashboardRoute, donationsRoute } from "@/routes";
import { theme } from "@/theme";

const ThankYouReference = () => {
  const { t } = useTranslation([PROFILE]);
  const router = useRouter();

  return (
    <>
      <Typography variant="h2">
        {t("profile:leave_reference.thank_you_header")}
      </Typography>
      <Typography sx={{ marginTop: theme.spacing(3) }}>
        {t("profile:leave_reference.thank_you_references_available")}
      </Typography>
      <Typography sx={{ marginTop: theme.spacing(3) }}>
        <Trans i18nKey="profile:leave_reference.thank_you_donation_prompt">
          Consider{" "}
          <StyledLink
            href={`${donationsRoute}?utm_source=leave-reference-thank-you`}
            sx={{ fontWeight: 600 }}
          >
            making a donation
          </StyledLink>
          ! Couchers.org is a 501(c)(3) non-profit organization and we need
          donations to keep our servers running
        </Trans>
      </Typography>
      <Typography sx={{ marginTop: theme.spacing(3) }}>
        {t("profile:leave_reference.thank_you_support")}
      </Typography>
      <Button
        sx={{ marginTop: theme.spacing(3) }}
        onClick={() => router.push(dashboardRoute)}
      >
        {t("profile:actions.back_to_dashboard")}
      </Button>
    </>
  );
};

export default ThankYouReference;
