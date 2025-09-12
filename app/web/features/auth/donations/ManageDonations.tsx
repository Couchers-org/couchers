import { Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

import Button from "@/components/Button";
import { DONATIONS } from "@/i18n/namespaces";
import { service } from "@/service";

type ManageDonationsProps = {
  className?: string;
};

const ManageDonations = ({ className }: ManageDonationsProps) => {
  const { t } = useTranslation([DONATIONS]);

  const router = useRouter();

  const goToPortal = async () => {
    await router.push(await service.donations.getDonationPortalLink());
  };

  return (
    <div className={className}>
      <Typography variant="h2">{t("settings_fragment.title")}</Typography>
      <Typography variant="body1" gutterBottom>
        {t("settings_fragment.description")}
      </Typography>
      <Typography variant="body1">
        <Button onClick={goToPortal}>
          {t("settings_fragment.button_text")}
        </Button>
      </Typography>
    </div>
  );
};

export default ManageDonations;
