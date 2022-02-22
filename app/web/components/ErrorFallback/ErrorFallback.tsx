import { Typography } from "@material-ui/core";
import Actions from "components/Actions";
import Button from "components/Button";
import ReportButton from "components/Navigation/ReportButton";
import PageTitle from "components/PageTitle";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";
import { GLOBAL } from "i18n/namespaces";

const useStyles = makeStyles((theme) => ({
  report: {
    marginTop: theme.spacing(2),
  },
}));

export default function ErrorFallback({ isFatal }: { isFatal?: boolean }) {
  const { t } = useTranslation(GLOBAL);
  const classes = useStyles();
  const router = useRouter();

  const handleRefresh = () => router.reload();

  return (
    <>
      <PageTitle>{t("error.fallback.title")}</PageTitle>
      <Typography variant="body1">
        {isFatal ? t("error.fatal_message") : t("error.fallback.subtitle")}
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
              {t("error.fallback.home_page_link_label")}
            </Button>
          </Link>
        )}

        <Button onClick={handleRefresh}>
          {t("error.fallback.refresh_page_button_label")}
        </Button>
      </Actions>
    </>
  );
}
