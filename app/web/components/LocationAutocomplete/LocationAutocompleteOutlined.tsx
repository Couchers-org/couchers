import {
  Autocomplete,
  AutocompleteChangeReason,
  InputAdornment,
} from "@mui/material";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
import TextField from "components/TextField";
import { FilterKey, FilterValue } from "features/search/SearchPage";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { forwardRef, SyntheticEvent, useState } from "react";
import { theme } from "theme";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";

interface LocationAutocompleteOutlinedProps {
  className?: string;
  defaultValue?: string;
  disableRegions?: boolean;
  fieldError?: string | undefined;
  fullWidth?: boolean;
  id?: string;
  label?: string;
  name: string;
  onChange: (filterKey: FilterKey, value: FilterValue) => void;
  onClear?: () => void;
  placeholder?: string;
  required?: string;
  showSearchIcon?: boolean;
  showFullDisplayName?: boolean;
}

const LocationAutocompleteOutlined = forwardRef(function LocationAutocomplete(
  props: LocationAutocompleteOutlinedProps,
  ref,
) {
  const {
    className,
    defaultValue = "",
    fieldError,
    fullWidth,
    placeholder,
    id = "location-autocomplete-outlined",
    label,
    onChange,
    onClear,
    showFullDisplayName = false,
    showSearchIcon = true,
  } = props;
  const { t } = useTranslation(GLOBAL);

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string>(defaultValue);

  const {
    query,
    results: options,
    error: geocodeError,
    isLoading,
  } = useGeocodeQuery();

  const handleChange = (
    event: SyntheticEvent<Element, Event>,
    newValue: string | GeocodeResult | null,
    reason: AutocompleteChangeReason,
  ) => {
    if (reason === "selectOption") {
      onChange("location", newValue);
      setIsOpen(false);
    }

    if (reason === "clear" && onClear) {
      onClear();
    }
  };

  const handleSearchSubmit = () => {
    query(value);
    setIsOpen(true);
  };

  const handleInputChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: string,
  ) => {
    if (value !== newValue) {
      setValue(newValue);
    }
  };

  return (
    <Autocomplete
      className={className}
      disableClearable={!onClear}
      defaultValue={
        options?.find(
          (o) => geocodeResult2String(o, showFullDisplayName) === defaultValue,
        ) || null
      }
      value={
        options?.find(
          (o) => geocodeResult2String(o, showFullDisplayName) === value,
        ) || null
      } // Convert string to GeocodeResult to appease TS and match options type
      id={id}
      ref={ref}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!fieldError || !!geocodeError}
          fullWidth={fullWidth}
          variant="outlined"
          placeholder={placeholder}
          InputProps={
            showSearchIcon
              ? {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      <InputAdornment
                        position="end"
                        sx={{
                          marginRight: value === "" ? theme.spacing(1) : 0,
                        }}
                      >
                        <IconButton
                          aria-label={t(
                            "location_autocomplete.search_location_button",
                          )}
                          onClick={handleSearchSubmit}
                          size="small"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    </>
                  ),
                }
              : params.InputProps
          }
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
        if (e.key === "Enter") {
          e.preventDefault();
          handleSearchSubmit();
        }
      }}
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

export default LocationAutocompleteOutlined;
