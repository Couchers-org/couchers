import { Clear } from "@mui/icons-material";
import {
  alpha,
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteInputChangeReason,
  CircularProgress,
  debounce,
  InputAdornment,
  InputProps,
  styled,
} from "@mui/material";
import IconButton from "components/IconButton";
import { MyLocationIcon, SearchIcon } from "components/Icons";
import TextField from "components/TextField";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import {
  forwardRef,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { service } from "service";
import { theme } from "theme";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";
import useMyLocation from "utils/useMyLocation";

// Debounced typeahead: wait this long after the last keystroke before querying,
// and require at least this many characters before firing a request. Mirrors
// LocationAutocomplete.
const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

interface LocationAutocompleteOutlinedProps {
  className?: string;
  defaultValue?: string;
  disableRegions?: boolean;
  fieldError?: string | undefined;
  fullWidth?: boolean;
  hasSearchValue?: boolean;
  id?: string;
  InputProps?: InputProps;
  label?: string;
  name: string;
  onChange: (value: GeocodeResult | undefined) => void;
  onClear?: () => void;
  placeholder?: string;
  required?: string;
  showFullDisplayName?: boolean;
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
}

const IconWrapper = styled("div")({
  display: "flex",
  alignItems: "center",
  borderRadius: "50%",
  backgroundColor: alpha(theme.palette.primary.light, 0.2),
  padding: theme.spacing(0.75),

  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.4),
  },
});

const StyledClearIcon = styled(Clear)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "30px",
  height: "18px",
  width: "18px",
}));

const LocationAutocompleteOutlined = forwardRef(function LocationAutocomplete(
  props: LocationAutocompleteOutlinedProps,
  ref,
) {
  const {
    className,
    defaultValue = "",
    fieldError,
    fullWidth,
    hasSearchValue,
    id = "location-autocomplete-outlined",
    InputProps,
    label,
    onChange,
    onClear,
    placeholder,
    showFullDisplayName = false,
    preferCity = false,
    biasToUserLocation = false,
    showUseMyLocation = false,
    allowFallback,
    autocompleteContext,
  } = props;
  const { t } = useTranslation([GLOBAL]);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(defaultValue || "");
  const [selected, setSelected] = useState<GeocodeResult | null>(null);

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

  // Geocode.earth is unavailable and we are serving results from the legacy
  // Nominatim fallback, which must not be queried as-you-type (OSM usage
  // policy). Fall back to the pre-LOC-1 interaction: the user types, then
  // submits with Enter or the search button.
  const isSubmitMode = provider === "nominatim";

  const debouncedQuery = useMemo(
    () => debounce((value: string) => query(value), SEARCH_DEBOUNCE_MS),
    [query],
  );
  useEffect(() => () => debouncedQuery.clear(), [debouncedQuery]);

  useEffect(() => {
    if (!hasSearchValue) {
      setInputValue("");
      setSelected(null);
    }
  }, [hasSearchValue]);

  // Show the clear control only when there is something to clear (typed text or
  // a selected place). Also swaps with "use my location": once the field has
  // content, that button would replace what the user is working on, so it steps
  // aside and comes back as soon as the field is empty again.
  const hasClearableValue = inputValue !== "" || selected !== null;

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
    onChange(place);
  };

  const handleChange = (
    event: SyntheticEvent<Element, Event>,
    newValue: NonNullable<string | GeocodeResult> | null,
    reason: AutocompleteChangeReason,
  ) => {
    if (reason === "selectOption") {
      onChange(newValue as GeocodeResult | undefined);
      setIsOpen(false);
      service.bugs.geolocationClickInfo({
        context: autocompleteContext,
        formattedResultJson: JSON.stringify(options),
        searchChoiceJson: JSON.stringify(newValue),
      });
    }
  };

  const handleSearchSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    debouncedQuery.clear();
    query(trimmed);
    setIsOpen(true);
  };

  const handleInputChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    if (inputValue !== newValue) {
      setInputValue(newValue);
    }

    // The user is doing exactly what a failed "use my location" told them to do,
    // so drop that message.
    resetMyLocationError();

    if (newValue === "") {
      debouncedQuery.clear();
      clearGeocodeResults();
      setIsOpen(false);
      if (onClear) {
        onClear();
      }
      return;
    }

    // MUI fires "reset" (selection made) and "clear" separately from typing;
    // only a real keystroke should trigger a new search.
    if (reason !== "input") {
      return;
    }

    if (isSubmitMode) {
      // No request until the user submits. Any results still on screen belong
      // to the previously submitted text, so drop them and close the list.
      debouncedQuery.clear();
      clearGeocodeResults();
      setIsOpen(false);
      return;
    }

    const trimmed = newValue.trim();
    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      setIsOpen(true);
      debouncedQuery(trimmed);
    } else {
      debouncedQuery.clear();
      clearGeocodeResults();
      setIsOpen(false);
    }
  };

  return (
    <Autocomplete
      className={className}
      clearIcon={
        <IconWrapper>
          <StyledClearIcon />
        </IconWrapper>
      }
      disableClearable={false}
      value={selected}
      inputValue={inputValue}
      id={id}
      ref={ref}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={
            !!fieldError ||
            !!geocodeError ||
            isProviderUnavailable ||
            !!myLocationError
          }
          helperText={
            // Never blocks typing: the field stays editable and the message clears
            // on the next keystroke (LOC-4's no-dead-end acceptance note).
            myLocationError ||
            (isProviderUnavailable
              ? t("location_autocomplete.provider_unavailable")
              : isSubmitMode
                ? t("location_autocomplete.search_location_hint")
                : undefined)
          }
          fullWidth={fullWidth}
          variant="outlined"
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {params.slotProps.input.endAdornment}
                  <InputAdornment
                    position="end"
                    sx={{
                      marginRight: inputValue === "" ? theme.spacing(1) : 0,
                    }}
                  >
                    {showUseMyLocation && !hasClearableValue && (
                      <IconButton
                        aria-label={t("use_my_location.button")}
                        title={t("use_my_location.button")}
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                        size="small"
                        sx={{ marginRight: theme.spacing(1) }}
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
                        aria-label={t(
                          "location_autocomplete.search_location_button",
                        )}
                        onClick={handleSearchSubmit}
                        size="small"
                        sx={{ marginRight: theme.spacing(1) }}
                      >
                        <SearchIcon />
                      </IconButton>
                    )}
                    {InputProps?.endAdornment}
                  </InputAdornment>
                </>
              ),
            },
          }}
        />
      )}
      loading={isLoading}
      options={options || []}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      getOptionLabel={(option) => {
        return geocodeResult2String(option, showFullDisplayName);
      }}
      onChange={handleChange}
      onInputChange={handleInputChange}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        // Stop the wrapping form from submitting. MUI still gets this event
        // and selects the highlighted option, if the list is open on one.
        e.preventDefault();
        if (isSubmitMode && !isOpen) {
          handleSearchSubmit();
        }
      }}
      freeSolo
      multiple={false}
      sx={{
        width: 300,
        "& button.MuiButtonBase-root": {
          visibility: "visible",
        },
      }}
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

export default LocationAutocompleteOutlined;
