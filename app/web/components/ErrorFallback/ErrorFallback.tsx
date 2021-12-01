import { Typography } from "@material-ui/core";
import Actions from "components/Actions";
import Button from "components/Button";
import ReportButton from "components/Navigation/ReportButton";
import PageTitle from "components/PageTitle";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  report: {
    marginTop: theme.spacing(2),
  },
}));

export default function ErrorFallback({ isFatal }: { isFatal?: boolean }) {
  const { t } = useTranslation("global");
  const classes = useStyles();
  const router = useRouter();

  const handleRefresh = () => router.reload();

  return (
    <>
      <PageTitle>{t("error_fallback.title")}</PageTitle>
      <Typography variant="body1">
        {isFatal ? t("fatal_error_message") : t("error_fallback.subtitle")}
      </Typography>
      {!isFatal && (
        <div className={classes.report}>
          <ReportButton isResponsive={false} />
        </div>
      )}

      <Actions>
        {!isFatal && (
          <Link href={baseRoute} passHref>
            <Button variant="outlined" component="a">
              {t("error_fallback.home_page_link_label")}
            </Button>
          </Link>
        )}

        <Button onClick={handleRefresh}>
          {t("error_fallback.refresh_page_button_label")}
        </Button>
      </Actions>
    </>
  );
}
