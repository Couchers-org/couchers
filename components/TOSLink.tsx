import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { tosRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
}));

export default function TOSLink() {
  const { t } = useTranslation("global");
  const classes = useStyles();
  return (
    <Link className={classes.root} to={tosRoute} target="_blank">
      {t("terms_of_service")}
    </Link>
  );
}
