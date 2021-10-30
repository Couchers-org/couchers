import Link from "next/link";
import { useTranslation } from "react-i18next";
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
    <Link href={tosRoute}>
      <a target="_blank" className={classes.root}>
        {t("terms_of_service")}
      </a>
    </Link>
  );
}
