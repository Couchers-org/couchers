import { Clear } from "@mui/icons-material";
import {
  Autocomplete,
  AutocompleteChangeReason,
  InputAdornment,
  InputProps,
  alpha,
  styled,
} from "@mui/material";
import { SyntheticEvent, useEffect, useState } from "react";

import IconButton from "@/components/IconButton";
import { SearchIcon } from "@/components/Icons";
import TextField from "@/components/TextField";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { theme } from "@/theme";
import { GeocodeResult, useGeocodeQuery } from "@/utils/hooks";

interface LocationAutocompleteOutlinedProps {
  className?: string;
  defaultValue?: string;
  disableRegions?: boolean;
  fieldError?: string | undefined;
  isFullWidth?: boolean;
  hasSearchValue?: boolean;
  id?: string;
  inputProps?: InputProps;
  label?: string;
  name: string;
  onChange: (value: GeocodeResult | undefined) => void;
  onClear?: () => void;
  placeholder?: string;
  required?: string;
  shouldShowFullDisplayName?: boolean;
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

const LocationAutocompleteOutlined = (
  props: LocationAutocompleteOutlinedProps,
) => {
  const {
    className,
    defaultValue = "",
    fieldError,
    isFullWidth,
    hasSearchValue,
    id = "location-autocomplete-outlined",
    inputProps,
    label,
    onChange,
    onClear,
    placeholder,
    shouldShowFullDisplayName = false,
  } = props;
  const { t } = useTranslation([GLOBAL]);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(defaultValue || "");
  const [selected, setSelected] = useState<GeocodeResult | null>(null);

  const {
    query,
    results: options,
    error: geocodeError,
    isLoading,
  } = useGeocodeQuery();

  useEffect(() => {
    if (!hasSearchValue) {
      setInputValue("");
      setSelected(null);
    }
  }, [hasSearchValue]);

  const handleChange = (
    _event: SyntheticEvent,
    newValue: NonNullable<string | GeocodeResult> | null,
    reason: AutocompleteChangeReason,
  ) => {
    if (reason === "selectOption") {
      onChange(newValue as GeocodeResult | undefined);
      setIsOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    void query(inputValue);
    setIsOpen(true);
  };

  const handleInputChange = (
    _event: React.SyntheticEvent,
    newValue: string,
  ) => {
    if (inputValue !== newValue) {
      setInputValue(newValue);
    }

    if (newValue === "" && onClear) {
      onClear();
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
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!fieldError || !!geocodeError}
          fullWidth={isFullWidth}
          variant="outlined"
          placeholder={placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {params.InputProps.endAdornment}
                  <InputAdornment
                    position="end"
                    sx={{
                      marginRight: inputValue === "" ? theme.spacing(1) : 0,
                    }}
                  >
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
                    {inputProps?.endAdornment}
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
      onClose={() => {
        setIsOpen(false);
      }}
      getOptionLabel={(option) => {
        return geocodeResult2String(option, shouldShowFullDisplayName);
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
      sx={{
        width: 300,
        "& button.MuiButtonBase-root": {
          visibility: "visible",
        },
      }}
    />
  );
};

const geocodeResult2String = (
  option: GeocodeResult | string,
  full: boolean,
) => {
  if (typeof option === "string") {
    return option;
  }
  if (full) {
    return option.name;
  }
  return option.simplifiedName;
};

export default LocationAutocompleteOutlined;
