import { AutocompleteChangeReason } from "@material-ui/lab";
import Autocomplete from "components/Autocomplete";
import React, { useRef, useState } from "react";
import { Control, useController } from "react-hook-form";
import { useGeocodeQuery } from "utils/hooks";

import { LOCATION, SEARCH_PROFILES, SELECT_LOCATION } from "./constants";

export default function LocationAutocomplete({
  control,
  params,
}: {
  control: Control;
  params: URLSearchParams;
}) {
  /// TODO(lucas) - test error logic
  const isValid = useRef(true);

  const controller = useController({
    name: "location",
    defaultValue: params.get("query") || "",
    control,
    rules: {
      validate: () => isValid.current,
    },
  });

  const { query, results: options, error, isLoading } = useGeocodeQuery();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (value: string) => {
    if (value === "") isValid.current = true;
    else isValid.current = false;
    controller.field.onChange(value);
  };

  const searchSubmit = (value: string, reason: AutocompleteChangeReason) => {
    //just close the menu is clicked away
    if (reason === "blur") {
      setIsOpen(false);
      return;
    }

    const searchOption = options?.find((o) => value === o.name);
    if (!searchOption) {
      //create-option is when enter is pressed on user-entered string
      if (reason === "create-option") {
        query(value);
        setIsOpen(true);
      }
    } else {
      params.set("location", searchOption.simplifiedName);
      params.set("lat", searchOption.location.lat.toString());
      params.set("lng", searchOption.location.lng.toString());
      isValid.current = true;
      setIsOpen(false);
    }
  };

  return (
    <Autocomplete
      id="location-autocomplete"
      innerRef={controller.field.ref}
      label={LOCATION}
      error={error || controller.meta.invalid ? SELECT_LOCATION : undefined}
      loading={isLoading}
      options={options?.map((result) => result.name) || []}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      value={controller.field.value}
      getOptionDisabled={(option) => option === SEARCH_PROFILES}
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
      onBlur={controller.field.onBlur}
      freeSolo
      multiple={false}
      disableClearable
    />
  );
}
