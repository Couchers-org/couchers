import { Box, CircularProgress, debounce, IconButton, styled } from "@mui/material";
import { AutocompleteChangeReason, AutocompleteInputChangeReason } from "@mui/material/Autocomplete";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "components/LocationAutocomplete/constants";
import useLocationAutocompleteOpen from "components/LocationAutocomplete/useLocationAutocompleteOpen";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FieldError } from "react-hook-form";
import { useLocationSearchSession } from "utils/geocodeTelemetry";
import { useGeocodeQuery } from "utils/hooks";
import useMyLocation from "utils/useMyLocation";

import Autocomplete from "./Autocomplete";
import { MyLocationIcon, SearchIcon } from "./Icons";

const MAP_SEARCH_ID = "map-search";
// Telemetry surface name, alongside the `autocompleteContext` values of the
// other location widgets.
const MAP_SEARCH_SURFACE = "edit-location-map";

const StyledBox = styled(Box)(({ theme }) => ({
  "& *": {
    opacity: 1,
  },
  "& .MuiAutocomplete-input": {
    fontSize: "0.75rem",
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.65rem",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.75rem",
  },
  background: "var(--mui-palette-background-default)",
  borderRadius: theme.shape.borderRadius * 3,
  left: 10,
  opacity: 0.9,
  padding: theme.spacing(1),
  position: "absolute",
  top: 10,
  width: "70%",
  zIndex: 1,
}));

const StyledForm = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
}));

interface MapSearchProps {
  setError: (error: string) => void;
  setResult: (lngLat: LngLat, address: string, simplifiedAddress: string) => void;
  inputFieldError?: FieldError;
  // Force the displayed address to the containing city/locality regardless of
  // what matched (street, venue, address, …), rather than the precise hit.
  collapseToCity?: boolean;
}

export default function MapSearch({ setError, setResult, inputFieldError, collapseToCity = false }: MapSearchProps) {
  const [value, setValue] = useState("");
  const { t } = useTranslation([GLOBAL]);

  // This widget sets the location stored on a user's profile (signup and profile
  // edit), so later we won't accept results from the legacy fallback provider —
  // those have no provider id
  const {
    query,
    clear: clearGeocodeResults,
    isLoading,
    results,
    error,
    isProviderUnavailable,
    provider,
  } = useGeocodeQuery({
    biasToUserLocation: true,
    collapseToCity,
    allowFallback: true /*false*/,
    surface: MAP_SEARCH_SURFACE,
  });
  const searchSession = useLocationSearchSession({
    surface: MAP_SEARCH_SURFACE,
    provider,
    results,
    error,
    isProviderUnavailable,
  });
  const {
    getMyLocation,
    isLoading: isLocating,
    error: myLocationError,
    reset: resetMyLocationError,
  } = useMyLocation({ collapseToCity });

  // Geocode.earth is unavailable and we are serving results from the legacy
  // Nominatim fallback, which must not be queried as-you-type (OSM usage
  // policy). Fall back to the pre-LOC-1 interaction: the user types, then
  // submits with Enter or the search button.
  const isSubmitMode = provider === "nominatim";

  const debouncedQuery = useMemo(() => debounce((v: string) => query(v), SEARCH_DEBOUNCE_MS), [query]);
  useEffect(() => () => debouncedQuery.clear(), [debouncedQuery]);

  // Run the geocode request only — the open hook opens the list after calling this.
  const searchSubmitQuery = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    debouncedQuery.clear();
    query(trimmed);
  };

  const {
    isOpen: open,
    setIsOpen: setOpen,
    closeIfAllowed,
    handleEnterKeyDown,
  } = useLocationAutocompleteOpen({
    id: MAP_SEARCH_ID,
    inputValue: value,
    options: results,
    query,
    isSubmitMode,
    searchSubmit: searchSubmitQuery,
  });

  // When an outage flips us into submit mode, drop any pending typeahead and
  // close the list so a leftover debounce cannot query Nominatim from a keystroke.
  const wasSubmitModeRef = useRef(isSubmitMode);
  useEffect(() => {
    if (isSubmitMode && !wasSubmitModeRef.current) {
      debouncedQuery.clear();
      setOpen(false);
    }
    wasSubmitModeRef.current = isSubmitMode;
  }, [debouncedQuery, isSubmitMode, setOpen]);

  //create a dummy search options if there are no results
  const searchOptions = isLoading
    ? []
    : results && results.length === 0
      ? [
          {
            location: new LngLat(0, 0),
            name: t("global:components.edit_location_map.no_location_results_text"),
            simplifiedName: "",
          },
        ]
      : results;

  const errorMessage = isProviderUnavailable
    ? t("global:location_autocomplete.provider_unavailable")
    : error || myLocationError || "";

  useEffect(() => {
    setError(errorMessage);
    if (errorMessage) setOpen(false);
  }, [errorMessage, setError, setOpen]);

  // LOC-4: fill the address field and move the pin from the device's position.
  // On any failure the hook's message shows and nothing changes, so the user can
  // still search or type — no dead end.
  const useMyLocationSubmit = async () => {
    const place = await getMyLocation();
    if (!place) {
      return;
    }
    searchSession.onUseMyLocation();
    setValue(place.simplifiedName);
    setOpen(false);
    setResult(place.location, place.name, place.simplifiedName);
  };

  const searchSubmit = (value: string, reason: AutocompleteChangeReason) => {
    if (reason === "blur") {
      closeIfAllowed();
      return;
    }
    const searchOption = results?.find((o) => value === o.name);

    if (!searchOption) {
      //createOption is when enter is pressed on user-entered string
      if (reason === "createOption") {
        searchSubmitQuery();
        setOpen(true);
      }
    } else {
      searchSession.onSelect(searchOption);
      setResult(searchOption.location, searchOption.name, searchOption.simplifiedName);
      setOpen(false);
    }
  };

  return (
    <StyledBox>
      <StyledForm>
        <Autocomplete
          id={MAP_SEARCH_ID}
          label={t("global:components.edit_location_map.search_location_label")}
          value={value}
          size="small"
          options={searchOptions?.map((o) => o.name) || []}
          loading={isLoading}
          open={open}
          onClose={closeIfAllowed}
          // Highlight the top result as it types in, so Enter alone confirms
          // it — keyboard-only use doesn't need an ArrowDown first.
          autoHighlight
          onBlur={closeIfAllowed}
          error={inputFieldError?.message}
          onInputChange={(e, v: string, reason: AutocompleteInputChangeReason) => {
            setValue(v);
            // They're typing, which is what a failed lookup told them to do.
            resetMyLocationError();

            if (reason !== "input") return;
            searchSession.onInput(v);

            if (isSubmitMode) {
              // No request until the user submits. Any results still on
              // screen belong to the previously submitted text.
              debouncedQuery.clear();
              clearGeocodeResults();
              setOpen(false);
              return;
            }

            const trimmed = v.trim();
            if (trimmed.length >= MIN_SEARCH_LENGTH) {
              setOpen(true);
              debouncedQuery(trimmed);
            } else {
              debouncedQuery.clear();
              clearGeocodeResults();
              setOpen(false);
            }
          }}
          onChange={(e, v, reason) => {
            setValue(v);
            searchSubmit(v, reason);
          }}
          freeSolo
          multiple={false}
          // show all returned results, don't do a filter client side
          filterOptions={(x) => x}
          disableClearable
          sx={{ flexGrow: 1 }}
          getOptionDisabled={(option) => option === t("global:components.edit_location_map.no_location_results_text")}
          helperText={isSubmitMode ? t("global:components.edit_location_map.press_enter_to_search") : undefined}
          onKeyDown={handleEnterKeyDown}
        />
        {isSubmitMode && (
          <IconButton
            aria-label={t("global:location_autocomplete.search_location_button")}
            size="medium"
            onClick={() => {
              searchSubmit(value, "createOption");
            }}
          >
            <SearchIcon />
          </IconButton>
        )}
        {/* Reverse geocode is Pelias-only — hide once forward search is on Nominatim. */}
        {provider === "pelias" && (
          <IconButton
            aria-label={t("global:use_my_location.button")}
            title={t("global:use_my_location.button")}
            size="medium"
            disabled={isLocating}
            onClick={useMyLocationSubmit}
          >
            {isLocating ? <CircularProgress size="1.25rem" /> : <MyLocationIcon />}
          </IconButton>
        )}
      </StyledForm>
    </StyledBox>
  );
}
