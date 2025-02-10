import {
  Autocomplete,
  InputAdornment,
  styled,
  TextFieldProps,
} from "@mui/material";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
import TextField from "components/TextField";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { forwardRef, useState } from "react";
import { theme } from "theme";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";

interface LocationAutocompleteOutlinedProps {
  className?: string;
  defaultValue?: string;
  disableRegions?: boolean;
  fieldError: string | undefined;
  fullWidth: boolean;
  id?: string;
  label?: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: string;
  showFullDisplayName?: boolean;
}

const StyledTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
  "& .MuiInputBase-root": {
    padding: theme.spacing(0.5),
    borderRadius: 100,
    width: "100%",
  },

  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderWidth: 1,
  },
}));

const LocationAutocomplete = forwardRef(function LocationAutocomplete(
  props: LocationAutocompleteOutlinedProps,
  ref,
) {
  const {
    className,
    defaultValue = "",
    fieldError,
    fullWidth,
    placeholder,
    id = "location-autocomplete",
    label,
    onChange,
    showFullDisplayName = false,
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

  const handleChange = () => {
    onChange(value);
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
      id={id}
      ref={ref}
      renderInput={(params) => (
        <StyledTextField
          {...params}
          label={label}
          error={!!fieldError || !!geocodeError}
          fullWidth={fullWidth}
          variant="outlined"
          value={value}
          placeholder={placeholder}
          helperText={
            fieldError === t("location_autocomplete.select_location_hint")
              ? t("location_autocomplete.select_location_hint")
              : t("location_autocomplete.search_location_hint")
          }
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {params.InputProps.endAdornment}
                <InputAdornment
                  position="end"
                  sx={{ marginRight: value === "" ? theme.spacing(1) : 0 }}
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

export default LocationAutocomplete;
