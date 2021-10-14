import { Link, makeStyles, Typography } from "@material-ui/core";
import classNames from "classnames";
import HtmlMeta from "components/HtmlMeta";
import Markdown from "components/Markdown";
import Landscape from "features/donations/resources/landscape.jpeg";
import { Trans, useTranslation } from "react-i18next";
import CouchersLogo from "resources/CouchersLogo";

import DonationsBox from "./DonationsBox";

const useStyles = makeStyles((theme) => ({
  donationsImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.3,
  },

  donationsLogo: {
    "&&": {
      height: "72px",
      width: "initial",
    },
  },

  donationsWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "120px",
  },

  donationsLogoHeader: {
    position: "absolute",
    zIndex: 1,
    maxWidth: "68.75rem",
    display: "flex",
    alignItems: "center",
    width: "100%",
    [theme.breakpoints.down("md")]: {
      maxWidth: "42rem",
    },
    [theme.breakpoints.down("sm")]: {
      margin: theme.spacing(0, 3),
    },
  },

  donationsLayoutPage: {
    display: "grid",
    gridTemplateColumns: "39rem 25.5rem",
    columnGap: theme.spacing(7.5),
    position: "relative",
    left: "50%",
    transform: "translateX(-50%)",
    justifyContent: "center",
    margin: theme.spacing(3, 0, 9, 0),
    [theme.breakpoints.down("md")]: {
      maxWidth: "42rem",
      display: "flex",
      flexDirection: "column",
    },
    [theme.breakpoints.down("sm")]: {
      maxWidth: "initial",
      left: "initial",
      transform: "initial",
      padding: theme.spacing(0, 3),
    },
  },

  donationsLogoText: {
    marginLeft: theme.spacing(2),
  },

  donationsText: {
    "&& li": {
      fontSize: "1rem",
    },
  },
  donationsLayoutText: {
    gridRow: "1 / 5",
    gridColumn: "1 / 2",
  },

  donationsLayoutBox: {
    gridRow: "1 / 2",
    gridColumn: "2 / 3",
  },

  donationsLayoutSecondaryTitle: {
    gridRow: "3 / 4",
    gridColumn: "2 / 3",
  },

  donationsLayoutBenefactorText: {
    gridRow: "2 / 3",
    gridColumn: "2 / 3",
  },

  donationsLayoutSecondaryText: {
    gridRow: "4 / 5",
    gridColumn: "2 / 3",
  },

  marginBottom2: {
    marginBottom: theme.spacing(2),
  },

  marginBottom3: {
    marginBottom: theme.spacing(3),
  },

  link: {
    fontSize: "0.75rem",
  },
}));

export default function Donations() {
  const classes = useStyles();

  const { t } = useTranslation("donations");

  return (
    <>
      <HtmlMeta title={t("donate")} />
      <div className={classes.donationsWrapper}>
        <div className={classes.donationsLogoHeader}>
          <CouchersLogo className={classes.donationsLogo} />
          <div className={classes.donationsLogoText}>
            <Typography variant="h2">{t("donations_banner.title")}</Typography>
            <Typography>{t("donations_banner.body")}</Typography>
          </div>
        </div>
        <img className={classes.donationsImage} src={Landscape} alt="" />
      </div>
      <section className={classes.donationsLayoutPage}>
        <div
          className={classNames(
            classes.marginBottom2,
            classes.donationsLayoutBox
          )}
        >
          <DonationsBox />
        </div>

        <Typography
          className={classNames(
            classes.marginBottom3,
            classes.donationsLayoutBenefactorText
          )}
          variant="body2"
        >
          <Trans t={t} i18nKey="benefactor_contact">
            If you wish to contribute over $1000, please contact us at
            <Link
              className={classes.link}
              href={`mailto:${t("benefactor_email")}`}
            >
              {{ email: t("benefactor_email") }}
            </Link>
            for us to arrange a lower fee transfer.
          </Trans>
        </Typography>

        <div
          className={classNames(
            classes.marginBottom3,
            classes.donationsLayoutText
          )}
        >
          <Typography variant="h1">{t("donations_title")}</Typography>
          <Markdown
            className={classes.donationsText}
            source={t("donations_text")}
          />
        </div>

        <Typography
          className={classes.donationsLayoutSecondaryTitle}
          variant="h2"
        >
          {t("donations_title2")}
        </Typography>

        <Markdown
          className={classNames(
            classes.donationsText,
            classes.donationsLayoutSecondaryText
          )}
          source={t("donations_text2")}
        />
      </section>
    </>
  );
}
