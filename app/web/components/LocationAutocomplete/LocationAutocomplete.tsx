import {
  AutocompleteChangeReason,
  AutocompleteInputChangeReason,
  CircularProgress,
  debounce,
  SxProps,
  Theme,
} from "@mui/material";
import Autocomplete from "components/Autocomplete";
import IconButton from "components/IconButton";
import { MyLocationIcon, SearchIcon } from "components/Icons";
import { GLOBAL } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { useTranslation } from "next-i18next";
import React, { useEffect, useMemo, useState } from "react";
import { Control, useController } from "react-hook-form";
import { service } from "service";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";
import useMyLocation from "utils/useMyLocation";

// Debounced typeahead: wait this long after the last keystroke before querying,
// and require at least this many characters before firing a request.
const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

// When the geocoder returns [], inject a fake option that looks like “No results”, mark it disabled, and ignore selecting it.
// Reason: MUI's autocompletes in `freeSolo` mode (i.e. user can type anything) never renders `noOptionsText`
const NO_RESULTS_ID = "__no_results__";

interface LocationAutocompleteProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue: GeocodeResult | "";
  fieldError: string | undefined;
  fullWidth?: boolean;
  label?: string;
  placeholder?: string;
  id?: string;
  variant?: "filled" | "standard" | "outlined" | undefined;
  name: string;
  onChange?(value: GeocodeResult | ""): void;
  required?: string;
  showFullDisplayName?: boolean;
  disableRegions?: boolean;
  // Soft-promote city hits over a leading neighbourhood, macrocounty, venue, address etc.
  preferCity?: boolean;
  // Rank places near the user's approximate location higher (LOC-3). Silent
  // best-effort: no permission prompt, unbiased results when unavailable
  biasToUserLocation?: boolean;
  // Show the "use my location" button (LOC-4), which fills the field from the
  // device's position. Prompts for permission, and always leaves manual typing
  // available on any failure.
  showUseMyLocation?: boolean;
  // Whether a Geocode.earth outage may be served by the legacy fallback
  // provider. Required, and later must be `false` wherever the chosen location is
  // persisted — fallback results have no provider id (see utils/geocode.ts).
  allowFallback: boolean;
  autocompleteContext: string;
  sx?: SxProps<Theme>;
}

const LocationAutocomplete = React.forwardRef(function LocationAutocomplete(props: LocationAutocompleteProps, ref) {
  const {
    className,
    control,
    defaultValue,
    fieldError,
    fullWidth,
    label,
    placeholder,
    id = "location-autocomplete",
    name,
    variant = "standard",
    onChange,
    required,
    showFullDisplayName = false,
    disableRegions = false,
    preferCity = false,
    biasToUserLocation = false,
    showUseMyLocation = false,
    allowFallback,
    autocompleteContext,
    sx,
  } = props;

  const { t } = useTranslation(GLOBAL);

  const controller = useController({
    name,
    defaultValue: defaultValue ?? "",
    control,
    rules: {
      required,
      validate: {
        didSelect: (value) =>
          value === "" || typeof value !== "string" ? true : false, // don't show a scary error while the autocomplete UI is displayed
        isSpecific: (value) =>
          !value?.isRegion || !disableRegions
            ? true
            : t("location_autocomplete.more_specific"),
      },
    },
  });

  const {
    query,
    clear: clearGeocodeResults,
    results: options,
    error: geocodeError,
    isLoading,
    provider,
    isProviderUnavailable,
  } = useGeocodeQuery({ preferCity, biasToUserLocation, allowFallback });
  // Same city-level/precise choice the typed search makes, so the button fills the
  // field with the kind of place this field is for.
  const {
    getMyLocation,
    isLoading: isLocating,
    error: myLocationError,
    reset: resetMyLocationError,
  } = useMyLocation({ preferCity });
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  // Geocode.earth is unavailable and we are serving results from the legacy
  // Nominatim fallback, which must not be queried as-you-type (OSM usage
  // policy). Fall back to the pre-LOC-1 interaction: the user types, then
  // submits with Enter or the search button.
  // TODO(LOC-eval): remove along with the Nominatim fallback.
  const isSubmitMode = provider === "nominatim";

  const debouncedQuery = useMemo(
    () => debounce((value: string) => query(value), SEARCH_DEBOUNCE_MS),
    [query],
  );
  useEffect(() => () => debouncedQuery.clear(), [debouncedQuery]);

  // The provider returned an empty result set for the current query (undefined
  // means "not searched yet", so only [] counts as empty).
  const hasEmptyResults =
    !isLoading &&
    options?.length === 0 &&
    inputValue.trim().length >= MIN_SEARCH_LENGTH;

  const displayOptions: GeocodeResult[] = hasEmptyResults
    ? [
        {
          id: NO_RESULTS_ID,
          name: t("location_autocomplete.no_results"),
          simplifiedName: t("location_autocomplete.no_results"),
          location: new LngLat(0, 0),
          bbox: [0, 0, 0, 0],
          isRegion: false,
        },
      ]
    : options || [];

  const isNoResultsOption = (value: GeocodeResult | string | null) =>
    typeof value === "object" && value !== null && value.id === NO_RESULTS_ID;

  // LOC-4: resolve the device position into a place and select it as if the user
  // had picked it from the list. On any failure the hook surfaces a message and we
  // change nothing, so typing remains the way out.
  const handleUseMyLocation = async () => {
    const place = await getMyLocation();
    if (!place) {
      return;
    }
    debouncedQuery.clear();
    clearGeocodeResults();
    setIsOpen(false);
    setInputValue(geocodeResult2String(place, showFullDisplayName));
    controller.field.onChange(place);
    onChange?.(place);
  };

  // Submit mode only: run the search the user explicitly asked for.
  const searchSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    query(trimmed);
    setIsOpen(true);
  };

  // Fired on every keystroke: drives the debounced typeahead query.
  const handleInputChange = (
    value: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    // MUI fires "reset" with the option's label when a selection is made; don't
    // treat that as a new search.
    if (value === controller.field.value?.simplifiedName) return;

    setInputValue(value);
    // The user is doing exactly what a failed "use my location" told them to do,
    // so drop that message.
    resetMyLocationError();
    // Keep the form value as the raw string until a real option is picked, so
    // form validation (didSelect) knows nothing has been selected yet.
    controller.field.onChange(value ?? "");

    if (reason === "input" || reason === "clear") {
      const trimmed = value.trim();
      if (isSubmitMode) {
        // No request until the user submits. Any results still on screen belong
        // to the previously submitted text, so drop them and close the list —
        // that also keeps Enter unambiguous: with the list closed it means
        // "search this text", with it open it means "take the highlighted hit".
        clearGeocodeResults();
        setIsOpen(false);
        return;
      }
      if (trimmed.length >= MIN_SEARCH_LENGTH) {
        setIsOpen(true);
        debouncedQuery(trimmed);
      } else {
        debouncedQuery.clear();
        clearGeocodeResults();
        setIsOpen(false);
      }
    }
  };

  // Fired when an option is chosen, the field is cleared, focus is lost, or the
  // user presses Enter on free-typed text.
  const handleChange = (
    value: GeocodeResult | string | null,
    reason: AutocompleteChangeReason,
  ) => {
    if (reason === "blur") {
      setIsOpen(false);
      return;
    }

    // The empty-state sentinel is not a real place — ignore any selection of it.
    if (isNoResultsOption(value)) {
      return;
    }

    controller.field.onChange(value ?? "");

    if (typeof value === "string") {
      setInputValue(value);
      // Defensive: MUI's freeSolo "createOption" path does not currently fire
      // here (see the Enter handling in onKeyDown for why), but if it does, treat
      // it as an explicit search and flush the debounce.
      if (reason === "createOption") {
        debouncedQuery.clear();
        query(value);
        setIsOpen(true);
      }
    } else {
      if (value) {
        setInputValue(geocodeResult2String(value, showFullDisplayName));
        service.bugs.geolocationClickInfo({
          context: autocompleteContext,
          formattedResultJson: JSON.stringify(options),
          searchChoiceJson: JSON.stringify(value),
        });
      } else {
        setInputValue("");
      }
      onChange?.(value ?? "");
      setIsOpen(false);
    }
  };

  // Show the clear control only when there is something to clear (typed text or
  // a selected place). MUI hides it by default when empty; be explicit so it
  // cannot stick around as a no-op affordance.
  // Also swaps with "use my location": once the field has content, that button
  // would replace what the user is working on, so it steps aside and comes back
  // as soon as the field is empty again (clear button or backspace).
  const hasClearableValue =
    inputValue !== "" ||
    (typeof controller.field.value === "object" &&
      controller.field.value !== null);

  return (
    <Autocomplete
      data-testid="location-autocomplete"
      className={className}
      id={id}
      ref={ref}
      label={label}
      error={
        fieldError ||
        (isProviderUnavailable
          ? t("location_autocomplete.provider_unavailable")
          : geocodeError) ||
        // Never blocks typing: the field stays editable and the message clears on
        // the next keystroke (LOC-4's no-dead-end acceptance note).
        myLocationError
      }
      fullWidth={fullWidth}
      variant={variant}
      placeholder={placeholder}
      sx={sx}
      helperText={
        isSubmitMode
          ? t("location_autocomplete.search_location_hint")
          : undefined
      }
      endAdornment={
        <>
          {showUseMyLocation && !hasClearableValue && (
            <IconButton
              aria-label={t("use_my_location.button")}
              title={t("use_my_location.button")}
              onClick={handleUseMyLocation}
              disabled={isLocating}
              size="small"
            >
              {isLocating ? (
                <CircularProgress size="1.25rem" />
              ) : (
                <MyLocationIcon />
              )}
            </IconButton>
          )}
          {isSubmitMode && (
            <IconButton
              aria-label={t("location_autocomplete.search_location_button")}
              onClick={searchSubmit}
              size="small"
            >
              <SearchIcon />
            </IconButton>
          )}
        </>
      }
      loading={isLoading}
      loadingText={t("location_autocomplete.loading")}
      options={displayOptions}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      value={controller.field.value}
      getOptionLabel={(option: GeocodeResult | string) => {
        return geocodeResult2String(option, showFullDisplayName);
      }}
      getOptionDisabled={(option) => isNoResultsOption(option)}
      isOptionEqualToValue={(option, value) => {
        if (typeof option === "string" || typeof value === "string") {
          return option === value;
        }
        if (option?.id && value?.id) {
          return option.id === value.id;
        }
        return option?.simplifiedName === value?.simplifiedName;
      }}
      filterOptions={(opts) => opts}
      onInputChange={(_e, value, reason) => handleInputChange(value, reason)}
      onChange={(_e, value, reason) => handleChange(value, reason)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        // Stop the wrapping <form> from submitting. MUI still gets this event and
        // selects the highlighted option, if the list is open on one.
        e.preventDefault();
        // In submit mode Enter is the search trigger, and we have to run it
        // ourselves: MUI's freeSolo "createOption" path is skipped because we
        // mirror the typed text into the form value, so it sees the input as
        // already equal to the selected value.
        if (isSubmitMode && !isOpen) {
          searchSubmit();
        }
      }}
      disableClearable={!hasClearableValue}
      // Override the slot's default visibility:hidden so the clear control is
      // always shown when rendered (non-empty field), including on touch.
      slotProps={{
        clearIndicator: {
          sx: { visibility: "visible" },
        },
      }}
      onBlur={controller.field.onBlur}
      freeSolo
      multiple={false}
    />
  );
});

function geocodeResult2String(option: GeocodeResult | string, full: boolean) {
  if (typeof option === "string") {
    return option;
  }
  if (full) {
    return option.name;
  }
  return option.simplifiedName;
}

export default LocationAutocomplete;
