import { AutocompleteChangeReason } from "@mui/material";
import Autocomplete from "components/Autocomplete";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
import { GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import React, { useState } from "react";
import { Control, useController } from "react-hook-form";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";

interface LocationAutocompleteProps {
  className?: string;
  control: Control;
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
}

const LocationAutocomplete = React.forwardRef(function LocationAutocomplete(
  props: LocationAutocompleteProps,
  ref
) {
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
            : t("location_autocomplete.select_location_hint"),
        isSpecific: (value) =>
          !value?.isRegion || !disableRegions
            ? true
            : t("location_autocomplete.more_specific"),
      },
    },
  });

  const {
    query,
    results: options,
    error: geocodeError,
    isLoading,
  } = useGeocodeQuery();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (value: GeocodeResult | string | null) => {
    //workaround - autocomplete seems to call onChange with the string value on mount
    //this line prevents needing to reselect the location even if there are no changes
    if (value === controller.field.value?.simplifiedName) return;

    controller.field.onChange(value ?? "");
  };

  const searchSubmit = (
    value: GeocodeResult | string | null,
    reason: AutocompleteChangeReason
  ) => {
    //just close if the menu is clicked away
    if (reason === "blur") {
      setIsOpen(false);
      return;
    }

    if (typeof value === "string") {
      //createOption is when enter is pressed on user-entered string
      if (reason === "createOption") {
        query(value);
        setIsOpen(true);
      }
    } else {
      onChange?.(value ?? "");
      setIsOpen(false);
    }
  };

  return (
    <Autocomplete
      className={className}
      id={id}
      ref={ref}
      label={label}
      error={fieldError || geocodeError}
      fullWidth={fullWidth}
      variant={variant}
      placeholder={placeholder}
      helperText={
        fieldError === t("location_autocomplete.select_location_hint")
          ? t("location_autocomplete.select_location_hint")
          : t("location_autocomplete.search_location_hint")
      }
      loading={isLoading}
      options={options || []}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      value={controller.field.value}
      getOptionLabel={(option: GeocodeResult | string) => {
        return geocodeResult2String(option, showFullDisplayName);
      }}
      onInputChange={(_e, value) => handleChange(value)}
      onChange={(_e, value, reason) => {
        handleChange(value);
        searchSubmit(value, reason);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          searchSubmit(controller.field.value, "createOption");
        }
      }}
      endAdornment={
        <IconButton
          aria-label={t("location_autocomplete.search_location_button")}
          onClick={() => searchSubmit(controller.field.value, "createOption")}
          size="small"
        >
          <SearchIcon />
        </IconButton>
      }
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
