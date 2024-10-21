import { Button, Typography } from "@material-ui/core";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { newEventRoute } from "routes";
import makeStyles from "utils/makeStyles";

import DiscoverEventsList from "../events/DiscoverEventsList";
import MyEventsList from "./MyEventsList";

const useStyles = makeStyles((theme) => ({
  button: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    margin: theme.spacing(2),
    padding: theme.spacing(1, 2),
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
    fontWeight: "bold",
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    paddingBottom: theme.spacing(1),
  },
}));

const EventsPage = () => {
  const classes = useStyles();
  const router = useRouter();

  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  return (
    <div>
      <div className={classes.headerRow}>
        <PageTitle>{t("communities:events_title")}</PageTitle>
        <Button
          className={classes.button}
          size="small"
          onClick={() => router.push(newEventRoute)}
        >
          {t("communities:create_new_event")}
        </Button>
      </div>
      <div className={classes.column}>
        <Typography variant="h2">{t("communities:your_events")}</Typography>
        <MyEventsList />
      </div>
      <DiscoverEventsList />
    </div>
  );
};

export default EventsPage;
