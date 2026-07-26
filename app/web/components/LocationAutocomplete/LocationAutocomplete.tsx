import {
  AutocompleteChangeReason,
  AutocompleteInputChangeReason,
  debounce,
  SxProps,
  Theme,
} from "@mui/material";
import Autocomplete from "components/Autocomplete";
import { GLOBAL } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import { useTranslation } from "next-i18next";
import React, { useEffect, useMemo, useState } from "react";
import { Control, useController } from "react-hook-form";
import { service } from "service";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";

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
          value === "" || typeof value !== "string"
            ? true
            : false, // don't show a scary error while the autocomplete UI is displayed
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
  } = useGeocodeQuery({ preferCity });
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

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

  // Fired on every keystroke: drives the debounced typeahead query.
  const handleInputChange = (
    value: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    // MUI fires "reset" with the option's label when a selection is made; don't
    // treat that as a new search.
    if (value === controller.field.value?.simplifiedName) return;

    setInputValue(value);
    // Keep the form value as the raw string until a real option is picked, so
    // form validation (didSelect) knows nothing has been selected yet.
    controller.field.onChange(value ?? "");

    if (reason === "input" || reason === "clear") {
      const trimmed = value.trim();
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
      // Enter on free-typed text (createOption): flush the debounce so results
      // appear immediately. Selecting a highlighted suggestion is handled by
      // MUI; free text alone never navigates (needs a real GeocodeResult).
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
      error={fieldError || geocodeError}
      fullWidth={fullWidth}
      variant={variant}
      placeholder={placeholder}
      sx={sx}
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
        // Stop the wrapping <form> from submitting on Enter. MUI still handles
        // selecting a highlighted option / createOption before this runs.
        if (e.key === "Enter") {
          e.preventDefault();
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
