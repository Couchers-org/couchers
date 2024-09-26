import { Button, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import CustomColorSwitch from "components/CustomColorSwitch";
import LocationAutocomplete from "components/LocationAutocomplete";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, SEARCH } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { newEventRoute } from "routes";
import { getCurrentUser } from "service/user";
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
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing(4),
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
  heading: {
    marginBottom: theme.spacing(2),
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
    [theme.breakpoints.down("sm")]: {
      marginRight: 0,
    },
  },
}));

const EventsPage = () => {
  const classes = useStyles();
  const router = useRouter();
  const { control, errors } = useForm({
    mode: "onChange",
  });
  const { t } = useTranslation([COMMUNITIES, SEARCH]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [eventType, setEventType] = useState<EventsType>("upcoming");
  const [showCancelled, setShowCancelled] = useState<boolean>(false);
  const [isMyCommunities, setIsMyCommunities] = useState<boolean>(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState<boolean>(false);
  const [nearMeLocation, setNearMeLocation] = useState<LngLat | undefined>();
  const [locationResult, setLocationResult] = useState<GeocodeResult | "">("");

  const allEventsPageTabLabels: Record<EventsType, string> = {
    upcoming: t("communities:upcoming"),
    past: t("communities:past"),
  };

  const handleToggleClick = (value: EventsType) => {
    if (value !== null && value !== eventType) {
      setEventType(value);
    }
  };

  const handleShowCancelledClick = () => {
    setShowCancelled(!showCancelled);
  };

  const handleFilterIsMyCommunitiesClick = () => {
    setIsMyCommunities(!isMyCommunities);
  };

  const handleFilterIsOnlineOnlyClick = () => {
    setNearMeLocation(undefined);
    setIsOnlineOnly(!isOnlineOnly);
  };

  const handleOnChangeAutocomplete = (event: GeocodeResult) => {
    if (event) {
      setIsOnlineOnly(false);
      setNearMeLocation(undefined);
      setLocationResult(event);
    } else {
      setLocationResult("");
    }
  };

  const handleFilterNearMeClick = async () => {
    const user = await getCurrentUser();

    if (nearMeLocation) {
      setNearMeLocation(undefined);
    } else {
      setIsOnlineOnly(false);
      setLocationResult("");
      setNearMeLocation(new LngLat(user.lng, user.lat));
    }
  };

  const renderLocationAutoComplete = () => (
    <LocationAutocomplete
      className={classes.locationSearch}
      control={control}
      name="location"
      defaultValue={locationResult}
      label={t("search:form.location_field_label")}
      onChange={handleOnChangeAutocomplete}
      fieldError={errors.location?.message}
      fullWidth={isMobile}
    />
  );

  const renderCustomColorSwitch = () => (
    <CustomColorSwitch
      checked={showCancelled}
      onClick={handleShowCancelledClick}
      label={t("communities:show_cancelled_events")}
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
      <TabContext value={eventType}>
        <div className={classes.row}>
          <TabBar
            ariaLabel={t("communities:all_events_page_tabs_a11y_label")}
            setValue={handleToggleClick}
            labels={allEventsPageTabLabels}
          />
          {!isMobile && renderCustomColorSwitch()}
        </div>
        <div className={classes.row}>
          <Typography className={classes.heading} variant="h2">
            {t("communities:your_events")}
          </Typography>
          {isMobile && renderCustomColorSwitch()}
        </div>
        <TabPanel value="upcoming">
          <MyEventsList eventType={eventType} showCancelled={showCancelled} />
        </TabPanel>
        <TabPanel value="past">
          <MyEventsList eventType={eventType} showCancelled={showCancelled} />
        </TabPanel>
      </TabContext>
      <div className={classes.row}>
        <Typography className={classes.heading} variant="h2">
          {t("communities:discover_events_title")}
        </Typography>
        <div className={classes.filterTags}>
          {!isMobile && renderLocationAutoComplete()}
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
            className={nearMeLocation ? classes.selectedFilter : classes.filter}
            variant="body2"
            onClick={handleFilterNearMeClick}
          >
            {t("communities:near_me")}
          </Typography>
          <Typography
            className={isOnlineOnly ? classes.selectedFilter : classes.filter}
            variant="body2"
            onClick={handleFilterIsOnlineOnlyClick}
          >
            {t("communities:online")}
          </Typography>
        </div>
        {isMobile && renderLocationAutoComplete()}
      </div>
      <DiscoverEventsList
        eventType={eventType}
        isVerticalStyle
        isMyCommunities={isMyCommunities}
        isOnlineOnly={isOnlineOnly}
        nearMeLocation={nearMeLocation}
        searchLocation={locationResult}
        showCancelled={showCancelled}
      />
    </div>
  );
};

export default EventsPage;
