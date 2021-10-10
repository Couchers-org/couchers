import classNames from "classnames";
import Button from "components/Button";
import TextField from "components/TextField";
import FilterDialog from "features/search/FilterDialog";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import useSearchFilters from "features/search/useSearchFilters";
import { LngLat } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

import { lastActiveOptions, LOCATION, OPEN_FILTER_DIALOG } from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    [theme.breakpoints.up("md")]: {
      display: "block",
      margin: "0 auto",
    },
  },
  mobileHide: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
}));

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const classes = useStyles();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  //we will useForm but all will be controlled because
  //of shared state with FilterDialog
  const { control, setValue } = useForm();
  //prevent defaultValue changing
  const defaultValues = useRef({
    location:
      searchFilters.active.location &&
      searchFilters.active.lng &&
      searchFilters.active.lat
        ? {
            name: searchFilters.active.location,
            simplifiedName: searchFilters.active.location,
            location: new LngLat(
              searchFilters.active.lng,
              searchFilters.active.lat
            ),
          }
        : undefined,
    keywords: searchFilters.active.query,
    lastActive: lastActiveOptions.find(
      (o) => o.value === searchFilters.active.lastActive
    ),
    hostingStatusOptions: searchFilters.active.hostingStatusOptions,
    numGuests: searchFilters.active.numGuests,
  }).current;

  const handleNewLocation = (value: "" | GeocodeResult) => {
    if (value === "") {
      searchFilters.remove("location");
      searchFilters.remove("lat");
      searchFilters.remove("lng");
    } else {
      searchFilters.change("location", value.simplifiedName);
      searchFilters.change("lat", value.location.lat);
      searchFilters.change("lng", value.location.lng);
    }
    searchFilters.apply();
  };

  useEffect(() => {
    setValue("location", searchFilters.active.location);
  }, [setValue, searchFilters.active.location]);

  return (
    <>
      <LocationAutocomplete
        control={control}
        name="location"
        defaultValue={defaultValues.location}
        label={LOCATION}
        onChange={handleNewLocation}
      />
      <Button
        onClick={() => setIsFiltersOpen(true)}
        className={classNames(className, classes.root)}
      >
        {OPEN_FILTER_DIALOG}
      </Button>
      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        searchFilters={searchFilters}
      />
    </>
  );
}
