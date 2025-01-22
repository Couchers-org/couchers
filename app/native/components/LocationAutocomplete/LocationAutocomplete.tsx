// import { AutocompleteChangeReason } from "@material-ui/lab";
// import Autocomplete from "@/components/Autocomplete";
// import IconButton from "@/components/IconButton";
// import { SearchIcon } from "@/components/Icons";
import { GLOBAL } from "@/i18n/namespaces";
// import { useTranslation } from "next-i18next";
import React, { useCallback, useState } from "react";
import { Control, useController } from "react-hook-form";
import { GeocodeResult, useGeocodeQuery } from "@/utils/hooks";
import { useTranslation } from "i18n";
import { Text } from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import { useDebouncedCallback } from "use-debounce";
import { ThemedText } from "../ThemedText";

interface LocationAutocompleteProps {
  control: Control;
  defaultValue: GeocodeResult | "";
  fieldError: string | undefined;
  // fullWidth?: boolean;
  // label?: string;
  placeholder?: string;
  // id?: string;
  // variant?: "filled" | "standard" | "outlined" | undefined;
  name: string;
  onSelectLocation?(value: GeocodeResult): void;
  required?: string;
  showFullDisplayName?: boolean;
  disableRegions?: boolean;
}

export default function LocationAutocomplete({
  control,
  defaultValue,
  // fieldError,
  // fullWidth,
  // label,
  // placeholder,
  // id = "location-autocomplete",
  name,
  // variant = "standard",
  onSelectLocation,
  required,
  showFullDisplayName = false,
  disableRegions = false,
}: LocationAutocompleteProps) {
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
    clear
  } = useGeocodeQuery();

  const debounce = useDebouncedCallback((value) => query(value), 1000);

  const handleChange = (value: GeocodeResult | string | null) => {
    //workaround - autocomplete seems to call onChange with the string value on mount
    //this line prevents needing to reselect the location even if there are no changes
    if (value === controller.field.value?.simplifiedName) return;

    controller.field.onChange(value ?? "");

    if (typeof value === "string" && value !== "" && value.length > 3) {
      debounce(value);
    }
  };

  return (
    <>
      <Autocomplete
        data={options ?? []}
        value={controller.field.value}
        onChangeText={(text) => handleChange(text)}
        placeholder={t("components.edit_location_map.search_location_label")}
        flatListProps={{
          keyExtractor: (item) => item.id.toString(),
          renderItem: ({ item }) => (
            <Text
              style={{
                padding: 15,
                borderBottomWidth: 1,
                borderBottomColor: "#e0e0e0",
              }}
              onPress={() => {
                onSelectLocation?.(item);
                clear();
              }}
            >
              {geocodeResult2String(item, showFullDisplayName)}
            </Text>
          ),
        }}
      />
      {isLoading && <ThemedText>Loading...</ThemedText>}
      {geocodeError && <ThemedText type="error">{geocodeError}</ThemedText>}
    </>
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

// <Autocomplete
//   id={id}
//   innerRef={controller.field.ref}
//   label={label}
//   error={fieldError || geocodeError}
//   fullWidth={fullWidth}
//   variant={variant}
//   placeholder={placeholder}
//   helperText={
//     fieldError === t("location_autocomplete.select_location_hint")
//       ? t("location_autocomplete.select_location_hint")
//       : t("location_autocomplete.search_location_hint")
//   }
//   loading={isLoading}
//   options={options || []}
//   open={isOpen}
//   onClose={() => setIsOpen(false)}
//   value={controller.field.value}
//   getOptionLabel={(option: GeocodeResult | string) => {
//     return geocodeResult2String(option, showFullDisplayName);
//   }}
//   onInputChange={(_e, value) => handleChange(value)}
//   onChange={(_e, value, reason) => {
//     handleChange(value);
//     searchSubmit(value, reason);
//   }}
//   onKeyDown={(e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       searchSubmit(controller.field.value, "create-option");
//     }
//   }}
//   endAdornment={
//     <IconButton
//       aria-label={t("location_autocomplete.search_location_button")}
//       onClick={() => searchSubmit(controller.field.value, "create-option")}
//       size="small"
//     >
//       <SearchIcon />
//     </IconButton>
//   }
//   onBlur={controller.field.onBlur}
//   freeSolo
//   multiple={false}
// />
