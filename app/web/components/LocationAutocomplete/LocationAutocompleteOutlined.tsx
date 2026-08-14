import { Clear } from "@mui/icons-material";
import {
  alpha,
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteInputChangeReason,
  debounce,
  InputAdornment,
  InputProps,
  styled,
} from "@mui/material";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
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
  } = useGeocodeQuery({ allowFallback });

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
          error={!!fieldError || !!geocodeError || isProviderUnavailable}
          helperText={
            isProviderUnavailable
              ? t("location_autocomplete.provider_unavailable")
              : isSubmitMode
                ? t("location_autocomplete.search_location_hint")
                : undefined
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
