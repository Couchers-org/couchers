import { AutocompleteChangeReason } from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useState } from "react";
import { Control, useController } from "react-hook-form";

import Autocomplete from "@/components/Autocomplete";
import IconButton from "@/components/IconButton";
import { SearchIcon } from "@/components/Icons";
import { GLOBAL } from "@/i18n/namespaces";
import { GeocodeResult, useGeocodeQuery } from "@/utils/hooks";

interface LocationAutocompleteProps {
  className?: string;
  control: Control;
  defaultValue: GeocodeResult | "";
  fieldError: string | undefined;
  isFullWidth?: boolean;
  label?: string;
  placeholder?: string;
  id?: string;
  variant?: "filled" | "standard" | "outlined" | undefined;
  name: string;
  onChange?: (value: GeocodeResult | "") => void;
  required?: string;
  shouldShowFullDisplayName?: boolean;
  shouldDisableRegions?: boolean;
}

const LocationAutocomplete = React.forwardRef<
  HTMLDivElement,
  LocationAutocompleteProps
>((props: LocationAutocompleteProps, ref) => {
  const {
    className,
    control,
    defaultValue,
    fieldError,
    isFullWidth,
    label,
    placeholder,
    id = "location-autocomplete",
    name,
    variant = "standard",
    onChange,
    required,
    shouldShowFullDisplayName = false,
    shouldDisableRegions = false,
  } = props;

  const { t } = useTranslation(GLOBAL);

  const controller = useController<{ [key: string]: GeocodeResult | "" }>({
    name,
    defaultValue,
    control,
    rules: {
      required,
      validate: {
        didSelect: (value) =>
          value === "" || typeof value !== "string"
            ? true
            : t("location_autocomplete.select_location_hint"),
        isSpecific: (value) =>
          !value || !value.isRegion || !shouldDisableRegions
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
    // workaround - autocomplete seems to call onChange with the string value on mount
    // this line prevents needing to reselect the location even if there are no changes
    if (
      value ===
      (!controller.field.value ? "" : controller.field.value.simplifiedName)
    )
      return;

    controller.field.onChange(value ?? "");
  };

  const searchSubmit = (
    value: GeocodeResult | string | null,
    reason: AutocompleteChangeReason,
  ) => {
    // just close if the menu is clicked away
    if (reason === "blur") {
      setIsOpen(false);
      return;
    }

    if (typeof value === "string") {
      // createOption is when enter is pressed on user-entered string
      if (reason === "createOption") {
        void query(value);
        setIsOpen(true);
      }
    } else {
      onChange?.(value ?? "");
      setIsOpen(false);
    }
  };

  return (
    <Autocomplete
      data-testid="location-autocomplete"
      className={className}
      id={id}
      ref={ref}
      label={label}
      error={fieldError || geocodeError}
      fullWidth={isFullWidth}
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
      onClose={() => {
        setIsOpen(false);
      }}
      value={controller.field.value}
      getOptionLabel={(option: GeocodeResult | string) => {
        return geocodeResultToString(option, shouldShowFullDisplayName);
      }}
      onInputChange={(_e, value) => {
        handleChange(value);
      }}
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
          onClick={() => {
            searchSubmit(controller.field.value, "createOption");
          }}
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

LocationAutocomplete.displayName = "LocationAutocomplete";

const geocodeResultToString = (
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

export default LocationAutocomplete;
