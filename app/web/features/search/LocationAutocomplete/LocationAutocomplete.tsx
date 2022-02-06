import { AutocompleteChangeReason } from "@material-ui/lab";
import Autocomplete from "components/Autocomplete";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
import React, { useState } from "react";
import { Control, useController } from "react-hook-form";
import { GeocodeResult, useGeocodeQuery } from "utils/hooks";

import {
  MUST_BE_MORE_SPECIFIC,
  SEARCH_LOCATION_BUTTON,
  SEARCH_LOCATION_HINT,
  SELECT_LOCATION,
} from "../constants";

interface LocationAutocompleteProps {
  control: Control;
  defaultValue: GeocodeResult | "";
  fieldError: string | undefined;
  fullWidth?: boolean;
  label: string;
  name: string;
  onChange?(value: GeocodeResult | ""): void;
  required?: string;
  showFullDisplayName?: boolean;
  disableRegions?: boolean;
}

export default function LocationAutocomplete({
  control,
  defaultValue,
  fieldError,
  fullWidth,
  label,
  name,
  onChange,
  required,
  showFullDisplayName = false,
  disableRegions = false,
}: LocationAutocompleteProps) {
  const controller = useController({
    name,
    defaultValue: defaultValue ?? "",
    control,
    rules: {
      required,
      validate: {
        didSelect: (value) =>
          value === "" || typeof value !== "string" ? true : SELECT_LOCATION,
        isSpecific: (value) =>
          !value?.isRegion || !disableRegions ? true : MUST_BE_MORE_SPECIFIC,
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
    if (typeof value === "object" || value === "" || value === null) {
      onChange?.(value ?? "");
    }
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
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
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
      id="location-autocomplete"
      innerRef={controller.field.ref}
      label={label}
      error={
        fieldError !== SELECT_LOCATION ? fieldError || geocodeError : undefined
      }
      fullWidth={fullWidth}
      helperText={
        fieldError === SELECT_LOCATION ? SELECT_LOCATION : SEARCH_LOCATION_HINT
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
          searchSubmit(controller.field.value, "create-option");
        }
      }}
      endAdornment={
        <IconButton
          aria-label={SEARCH_LOCATION_BUTTON}
          onClick={() => searchSubmit(controller.field.value, "create-option")}
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
}

function geocodeResult2String(option: GeocodeResult | string, full: boolean) {
  if (typeof option === "string") {
    return option;
  }
  if (full) {
    return option.name;
  }
  return option.simplifiedName;
}
