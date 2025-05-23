import { Link, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";
import HtmlMeta from "components/HtmlMeta";
import Markdown from "components/Markdown";
import Landscape from "features/donations/resources/landscape.jpeg";
import { DONATIONS, GLOBAL } from "i18n/namespaces";
import { Trans, useTranslation } from "next-i18next";
import CouchersLogo from "resources/CouchersLogo";
import { foundationRoute, latestFinancialsURL } from "routes";

import { BENEFACTOR_EMAIL } from "./constants";
import DonationsBox from "./DonationsBox";

const useStyles = makeStyles((theme) => ({
  donationsImage: {
    position: "absolute",
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
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "120px",
  },

  donationsLogoHeader: {
    position: "relative",
    zIndex: 1,
    maxWidth: "68.75rem",
    display: "flex",
    alignItems: "center",
    width: "100%",
    [theme.breakpoints.down("lg")]: {
      maxWidth: "42rem",
    },
    [theme.breakpoints.down("md")]: {
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
    [theme.breakpoints.down("lg")]: {
      maxWidth: "42rem",
      display: "flex",
      flexDirection: "column",
    },
    [theme.breakpoints.down("md")]: {
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

  const { t } = useTranslation([GLOBAL, DONATIONS]);

  return (
    <>
      <HtmlMeta title={t("donations:donate")} />
      <div className={classes.donationsWrapper}>
        <div className={classes.donationsLogoHeader}>
          <CouchersLogo className={classes.donationsLogo} />
          <div className={classes.donationsLogoText}>
            <Typography variant="h2">
              {t("donations:donations_banner.title")}
            </Typography>
            <Typography>{t("donations:donations_banner.body")}</Typography>
          </div>
        </div>
        <img className={classes.donationsImage} src={Landscape.src} alt="" />
      </div>
      <section className={classes.donationsLayoutPage}>
        <div
          className={classNames(
            classes.marginBottom2,
            classes.donationsLayoutBox,
          )}
        >
          <DonationsBox />
        </div>

        <div className={classes.donationsLayoutBenefactorText}>
          <Typography className={classes.marginBottom3} variant="body2">
            <Trans
              t={t}
              i18nKey="donations:donations_info"
              values={{ legal_name: t("global:legal_name") }}
            >
              Your donation goes to
              <Link
                className={classes.link}
                href={foundationRoute}
                underline="hover"
              >
                {t("global:legal_name")}
              </Link>
              , a U.S. 501(c)(3) non-profit that operates the Couchers.org
              service and supports the project. Donations are tax exempt, our
              EIN is 87-1734577.
            </Trans>
          </Typography>

          <Typography className={classes.marginBottom3} variant="body2">
            <Trans
              t={t}
              i18nKey="donations:benefactor_contact"
              values={{ email: BENEFACTOR_EMAIL }}
            >
              If you wish to contribute over $1000, please contact us at
              <Link
                className={classes.link}
                href={`mailto:${BENEFACTOR_EMAIL}`}
                underline="hover"
              >
                {BENEFACTOR_EMAIL}
              </Link>
              for us to arrange a lower fee transfer.
            </Trans>
          </Typography>
        </div>
        <div
          className={classNames(
            classes.marginBottom3,
            classes.donationsLayoutText,
          )}
        >
          <Typography variant="h1">{t("donations:donations_title")}</Typography>
          <Markdown
            className={classes.donationsText}
            source={t("donations:donations_text")}
          />
        </div>

        <Typography
          className={classes.donationsLayoutSecondaryTitle}
          variant="h2"
        >
          {t("donations:donations_title2")}
        </Typography>

        <div
          className={classNames(
            classes.donationsText,
            classes.donationsLayoutSecondaryText,
          )}
        >
          <Markdown
            className={classNames(
              classes.donationsText,
              classes.donationsLayoutSecondaryText,
            )}
            source={t("donations:donations_text2")}
          />
          <Typography variant="body1">
            <Link href={latestFinancialsURL} underline="hover">
              <Trans
                t={t}
                i18nKey="donations:donations_use_explainer"
                values={{ year: "2024" }}
              />
            </Link>
          </Typography>
        </div>
      </section>
    </>
  );
}
