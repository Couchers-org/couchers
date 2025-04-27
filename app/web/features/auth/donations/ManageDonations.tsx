import { Typography } from "@mui/material";
import Button from "components/Button";
import { DONATIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { service } from "service";

type ManageDonationsProps = {
  className?: string;
};

export default function ManageDonations({ className }: ManageDonationsProps) {
  const { t } = useTranslation([DONATIONS]);

  const router = useRouter();

  const goToPortal = async () => {
    router.push(await service.donations.getDonationPortalLink());
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
}
