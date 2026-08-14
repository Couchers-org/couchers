import {
  Box,
  CircularProgress,
  debounce,
  IconButton,
  styled,
} from "@mui/material";
import {
  AutocompleteChangeReason,
  AutocompleteInputChangeReason,
} from "@mui/material/Autocomplete";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import React, { useEffect, useMemo, useState } from "react";
import { FieldError } from "react-hook-form";
import { useGeocodeQuery } from "utils/hooks";
import useMyLocation from "utils/useMyLocation";

import Autocomplete from "./Autocomplete";
import { MyLocationIcon, SearchIcon } from "./Icons";

// Debounced typeahead: wait this long after the last keystroke before querying,
// and require at least this many characters before firing a request. Mirrors
// LocationAutocomplete.
const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

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
  setResult: (
    lngLat: LngLat,
    address: string,
    simplifiedAddress: string,
  ) => void;
  inputFieldError?: FieldError;
}

export default function MapSearch({
  setError,
  setResult,
  inputFieldError,
}: MapSearchProps) {
  const [open, setOpen] = useState(false);
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
  } = useGeocodeQuery({ allowFallback: true /*false*/ });
  const {
    getMyLocation,
    isLoading: isLocating,
    error: myLocationError,
    reset: resetMyLocationError,
  } = useMyLocation();

  // Geocode.earth is unavailable and we are serving results from the legacy
  // Nominatim fallback, which must not be queried as-you-type (OSM usage
  // policy). Fall back to the pre-LOC-1 interaction: the user types, then
  // submits with Enter or the search button.
  const isSubmitMode = provider === "nominatim";

  const debouncedQuery = useMemo(
    () => debounce((v: string) => query(v), SEARCH_DEBOUNCE_MS),
    [query],
  );
  useEffect(() => () => debouncedQuery.clear(), [debouncedQuery]);

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
  }, [errorMessage, setError]);

  // LOC-4: fill the address field and move the pin from the device's position.
  // On any failure the hook's message shows and nothing changes, so the user can
  // still search or type — no dead end.
  const useMyLocationSubmit = async () => {
    const place = await getMyLocation();
    if (!place) {
      return;
    }
    setValue(place.simplifiedName);
    setOpen(false);
    setResult(place.location, place.name, place.simplifiedName);
  };

  const searchSubmit = (value: string, reason: AutocompleteChangeReason) => {
    if (reason === "blur") {
      setOpen(false);
      return;
    }
    const searchOption = results?.find((o) => value === o.name);

    if (!searchOption) {
      //createOption is when enter is pressed on user-entered string
      if (reason === "createOption") {
        const trimmed = value.trim();
        if (!trimmed) return;
        debouncedQuery.clear();
        query(trimmed);
        setOpen(true);
      }
    } else {
      setResult(searchOption.location, searchOption.name, searchOption.simplifiedName);
      setOpen(false);
    }
  };

  return (
    <StyledBox>
      <StyledForm>
        <Autocomplete
          id="map-search"
          label={t("global:components.edit_location_map.search_location_label")}
          value={value}
          size="small"
          options={searchOptions?.map((o) => o.name) || []}
          loading={isLoading}
          open={open}
          // Highlight the top result as it types in, so Enter alone confirms
          // it — keyboard-only use doesn't need an ArrowDown first.
          autoHighlight
          onBlur={() => setOpen(false)}
          error={inputFieldError?.message}
          onInputChange={(
            e,
            v: string,
            reason: AutocompleteInputChangeReason,
          ) => {
            setValue(v);
            // They're typing, which is what a failed lookup told them to do.
            resetMyLocationError();

            if (reason !== "input") return;

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
          getOptionDisabled={(option) =>
            option ===
            t("global:components.edit_location_map.no_location_results_text")
          }
          helperText={
            isSubmitMode
              ? t("global:components.edit_location_map.press_enter_to_search")
              : undefined
          }
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (isSubmitMode && !open) {
              searchSubmit(value, "createOption");
            }
          }}
        />
        {isSubmitMode && (
          <IconButton
            aria-label={t(
              "global:location_autocomplete.search_location_button",
            )}
            size="medium"
            onClick={() => {
              searchSubmit(value, "createOption");
            }}
          >
            <SearchIcon />
          </IconButton>
        )}
        <IconButton
          aria-label={t("global:use_my_location.button")}
          title={t("global:use_my_location.button")}
          size="medium"
          disabled={isLocating}
          onClick={useMyLocationSubmit}
        >
          {isLocating ? (
            <CircularProgress size="1.25rem" />
          ) : (
            <MyLocationIcon />
          )}
        </IconButton>
      </StyledForm>
    </StyledBox>
  );
}
