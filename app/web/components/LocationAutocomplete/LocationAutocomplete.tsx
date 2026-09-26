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
import { useTranslation } from "next-i18next";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Control, useController, useFormState } from "react-hook-form";
import { service } from "service";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";
import useMyLocation from "utils/useMyLocation";

import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "./constants";
import { buildLocationDisplayOptions, isNoResultsOption } from "./displayOptions";
import { geocodeResult2String } from "./geocodeResult2String";
import useLocationAutocompleteOpen from "./useLocationAutocompleteOpen";

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
  // Parent is navigating / submitting after a selection: lock the field and
  // show a spinner so the user doesn't keep typing into a dead zone.
  isPending?: boolean;
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
    isPending = false,
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
        // Free text is never a place (no coordinates). Return bare false so we
        // don't show a validation message while the list is open; on submit we
        // reopen the list instead (see useLocationAutocompleteOpen).
        didSelect: (value) => (value === "" || typeof value !== "string" ? true : false),
        isSpecific: (value) => (!value?.isRegion || !disableRegions ? true : t("location_autocomplete.more_specific")),
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

  // Subscribe so submitCount updates re-render this component.
  const { submitCount } = useFormState({ control });

  // Geocode.earth is unavailable and we are serving results from the legacy
  // Nominatim fallback, which must not be queried as-you-type (OSM usage
  // policy). Fall back to the pre-LOC-1 interaction: the user types, then
  // submits with Enter or the search button.
  // TODO(LOC-eval): remove along with the Nominatim fallback.
  const isSubmitMode = provider === "nominatim";

  const debouncedQuery = useMemo(() => debounce((value: string) => query(value), SEARCH_DEBOUNCE_MS), [query]);
  useEffect(() => () => debouncedQuery.clear(), [debouncedQuery]);

  const [inputValue, setInputValue] = useState<string>("");

  // Run the geocode request only — the open hook opens the list after calling this.
  const searchSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    query(trimmed);
  };

  const freeTextForSubmit = typeof controller.field.value === "string" ? controller.field.value : "";

  const { isOpen, setIsOpen, closeIfAllowed, handleEnterKeyDown } = useLocationAutocompleteOpen({
    id,
    inputValue,
    options,
    query,
    isSubmitMode,
    searchSubmit,
    enableSubmitReopen: true,
    freeTextForSubmit,
    submitCount,
  });

  // When an outage flips us into submit mode, drop any pending typeahead and
  // close the list so a leftover debounce cannot query Nominatim from a keystroke.
  const wasSubmitModeRef = useRef(isSubmitMode);
  useEffect(() => {
    if (isSubmitMode && !wasSubmitModeRef.current) {
      debouncedQuery.clear();
      setIsOpen(false);
    }
    wasSubmitModeRef.current = isSubmitMode;
  }, [debouncedQuery, isSubmitMode, setIsOpen]);

  const displayOptions = buildLocationDisplayOptions(
    options,
    inputValue,
    isLoading,
    t("location_autocomplete.no_results"),
  );

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

  // Fired on every keystroke: drives the debounced typeahead query.
  const handleInputChange = (value: string, reason: AutocompleteInputChangeReason) => {
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
  const handleChange = (value: GeocodeResult | string | null, reason: AutocompleteChangeReason) => {
    if (reason === "blur") {
      closeIfAllowed();
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
    inputValue !== "" || (typeof controller.field.value === "object" && controller.field.value !== null);

  return (
    <Autocomplete
      data-testid="location-autocomplete"
      className={className}
      id={id}
      ref={ref}
      label={label}
      error={
        fieldError ||
        (isProviderUnavailable ? t("location_autocomplete.provider_unavailable") : geocodeError) ||
        // Never blocks typing: the field stays editable and the message clears on
        // the next keystroke (LOC-4's no-dead-end acceptance note).
        myLocationError
      }
      fullWidth={fullWidth}
      variant={variant}
      placeholder={placeholder}
      sx={sx}
      helperText={isSubmitMode ? t("location_autocomplete.search_location_hint") : undefined}
      endAdornment={
        <>
          {isPending && <CircularProgress size="1.25rem" />}
          {/* Reverse geocode is Pelias-only — hide once forward search is on Nominatim. */}
          {showUseMyLocation && provider === "pelias" && !hasClearableValue && !isPending && (
            <IconButton
              aria-label={t("use_my_location.button")}
              title={t("use_my_location.button")}
              onClick={handleUseMyLocation}
              disabled={isLocating}
              size="small"
            >
              {isLocating ? <CircularProgress size="1.25rem" /> : <MyLocationIcon />}
            </IconButton>
          )}
          {isSubmitMode && !isPending && (
            <IconButton
              aria-label={t("location_autocomplete.search_location_button")}
              onClick={() => {
                searchSubmit();
                setIsOpen(true);
              }}
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
      open={isOpen && !isPending}
      onClose={closeIfAllowed}
      readOnly={isPending}
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
      onKeyDown={handleEnterKeyDown}
      disableClearable={!hasClearableValue || isPending}
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

export default LocationAutocomplete;
