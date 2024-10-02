import { Button, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import LocationAutocomplete from "components/LocationAutocomplete";
import PageTitle from "components/PageTitle";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { newEventRoute } from "routes";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import DiscoverEventsList from "./DiscoverEventsList";
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
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    paddingBottom: theme.spacing(1),
  },
  filter: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    padding: theme.spacing(1, 2),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 6,
    "&:hover": {
      cursor: "pointer",
    },
  },
  filterTags: {
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  selectedFilter: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(1, 2),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 6,
    "&:hover": {
      cursor: "pointer",
    },
  },
  locationSearch: {
    marginRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
}));

const EventsPage = () => {
  const classes = useStyles();
  const router = useRouter();
  const { control, errors } = useForm({
    mode: "onChange",
  });
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [eventType, setEventType] = useState<EventsType>("upcoming");
  const [showCancelled, setShowCancelled] = useState<boolean>(false);
  const [isMyCommunities, setIsMyCommunities] = useState<boolean>(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState<boolean>(false);
  const [locationResult, setLocationResult] = useState<GeocodeResult | "">("");

  const handleFilterPastClick = () => {
    if (eventType === "upcoming") {
      setEventType("past");
    } else {
      setEventType("upcoming");
    }
  };

  const handleFilterShowCancelledClick = () => {
    setShowCancelled(!showCancelled);
  };

  const handleFilterIsMyCommunitiesClick = () => {
    setIsMyCommunities(!isMyCommunities);
  };

  const handleFilterIsOnlineOnlyClick = () => {
    if (isOnlineOnly) {
      setLocationResult("");
    }
    setIsOnlineOnly(!isOnlineOnly);
  };

  const handleOnChangeAutocomplete = (newLocationResult: GeocodeResult) => {
    if (typeof newLocationResult === "object") {
      setIsOnlineOnly(false);
      setLocationResult(newLocationResult);
    } else {
      setLocationResult("");
    }
  };

  const renderLocationAutoComplete = () => (
    <LocationAutocomplete
      className={classes.locationSearch}
      control={control}
      name="location"
      defaultValue={typeof locationResult === "object" ? locationResult : ""}
      label={t("global:location_autocomplete.search_location_button")}
      onChange={handleOnChangeAutocomplete}
      fieldError={errors.location?.message}
      fullWidth={isMobile}
    />
  );

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
        <div className={classes.filterTags}>
          <Typography
            className={
              eventType === "past" ? classes.selectedFilter : classes.filter
            }
            variant="body2"
            onClick={handleFilterPastClick}
          >
            {t("communities:past")}
          </Typography>
          <Typography
            className={showCancelled ? classes.selectedFilter : classes.filter}
            variant="body2"
            onClick={handleFilterShowCancelledClick}
          >
            {t("communities:show_cancelled_events")}
          </Typography>
        </div>
        <MyEventsList eventType={eventType} showCancelled={showCancelled} />
      </div>
      <div className={classes.column}>
        <Typography variant="h2">
          {t("communities:discover_events_title")}
        </Typography>
        <div className={classes.row}>
          <div className={classes.filterTags}>
            <Typography
              className={
                isMyCommunities ? classes.selectedFilter : classes.filter
              }
              variant="body2"
              onClick={handleFilterIsMyCommunitiesClick}
            >
              {t("communities:communities")}
            </Typography>
            <Typography
              className={isOnlineOnly ? classes.selectedFilter : classes.filter}
              variant="body2"
              onClick={handleFilterIsOnlineOnlyClick}
            >
              {t("communities:online")}
            </Typography>
          </div>
          {!isMobile && renderLocationAutoComplete()}
        </div>
        {isMobile && renderLocationAutoComplete()}
      </div>
      <DiscoverEventsList
        eventType={eventType}
        isVerticalStyle
        isMyCommunities={isMyCommunities}
        isOnlineOnly={isOnlineOnly}
        searchLocation={locationResult}
        showCancelled={showCancelled}
      />
    </div>
  );
};

export default EventsPage;
