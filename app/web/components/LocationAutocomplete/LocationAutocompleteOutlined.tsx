import { Clear } from "@mui/icons-material";
import {
  alpha,
  Autocomplete,
  AutocompleteChangeReason,
  InputAdornment,
  InputProps,
  styled,
} from "@mui/material";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
import TextField from "components/TextField";
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
  InputProps?: InputProps;
  label?: string;
  name: string;
  onChange: (value: GeocodeResult | undefined) => void;
  onClear?: () => void;
  placeholder?: string;
  required?: string;
  showFullDisplayName?: boolean;
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
    id = "location-autocomplete-outlined",
    InputProps,
    label,
    onChange,
    onClear,
    placeholder,
    showFullDisplayName = false,
  } = props;
  const { t } = useTranslation([GLOBAL]);

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
    newValue: NonNullable<string | GeocodeResult> | null,
    reason: AutocompleteChangeReason,
  ) => {
    if (reason === "selectOption") {
      onChange(newValue as GeocodeResult | undefined);
      setIsOpen(false);
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
      value={
        defaultValue
          ? ({
              name: defaultValue,
              simplifiedName: defaultValue,
            } as GeocodeResult)
          : null // Ensure it's never undefined or get uncontrolled state error
      }
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
          InputProps={{
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
                    sx={{ marginRight: theme.spacing(1) }}
                  >
                    <SearchIcon />
                  </IconButton>
                  {InputProps?.endAdornment}
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
