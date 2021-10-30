import { Typography } from "@material-ui/core";
import Actions from "components/Actions";
import Button from "components/Button";
import PageTitle from "components/PageTitle";
import ReportButton from "features/ReportButton";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
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

  const history = useHistory();

  const handleRefresh = () => history.go(0);

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
          <Link to={{ pathname: baseRoute }}>
            <Button variant="outlined">
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
