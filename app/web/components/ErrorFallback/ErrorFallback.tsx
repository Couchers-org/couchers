import { Typography, styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";

import Actions from "@/components/Actions";
import Button from "@/components/Button";
import ReportButton from "@/components/Navigation/ReportButton";
import PageTitle from "@/components/PageTitle";
import { GLOBAL } from "@/i18n/namespaces";
import { BASE_ROUTE } from "@/routes";
import { theme } from "@/theme";

const StyledReportButton = styled(ReportButton)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const ErrorFallback = ({ isFatal }: { isFatal?: boolean }) => {
  const { t } = useTranslation(GLOBAL);
  const router = useRouter();

  const handleRefresh = () => {
    router.reload();
  };

  return (
    <>
      <PageTitle>{t("error.fallback.title")}</PageTitle>
      <Typography variant="body1">
        {isFatal ? t("error.fatal_message") : t("error.fallback.subtitle")}
      </Typography>
      {!isFatal && <StyledReportButton isResponsive={false} />}
      <Actions>
        {!isFatal && (
          <Button
            variant="outlined"
            component={Link}
            href={BASE_ROUTE}
            sx={{
              color: theme.palette.common.black,
              borderColor: theme.palette.grey[300],

              "&:hover": {
                borderColor: theme.palette.grey[300],
                backgroundColor: "#3135390A",
              },
            }}
          >
            {t("error.fallback.home_page_link_label")}
          </Button>
        )}

        <Button onClick={handleRefresh}>
          {t("error.fallback.refresh_page_button_label")}
        </Button>
      </Actions>
    </>
  );
};

export default ErrorFallback;
