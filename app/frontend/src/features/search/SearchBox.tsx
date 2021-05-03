import { AutocompleteChangeReason } from "@material-ui/lab";
import Autocomplete from "components/Autocomplete";
import { SEARCH_PROFILES, USER_SEARCH } from "features/search/constants";
import { LngLat } from "maplibre-gl";
import React, { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import { searchRoute } from "routes";
import { useGeocodeQuery } from "utils/hooks";

export default function SearchBox({ className }: { className?: string }) {
  const { control } = useForm<{ query: string }>();

  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const handleSubmit = (query: string, lngLat?: LngLat) => {
    if (query) params.set("query", query);
    if (lngLat) {
      params.set("lat", lngLat.lat.toString());
      params.set("lng", lngLat.lng.toString());
    }
    history.push(`${searchRoute}?${params.toString()}`);
  };

  const controller = useController({
    name: "query",
    defaultValue: params.get("query") || "",
    control,
  });

  const { query, results, error, isLoading } = useGeocodeQuery();
  const [isOpen, setIsOpen] = useState(false);

  const options = results
    ? [
        {
          //this object will be disabled using getOptionDisabled
          name: SEARCH_PROFILES,
          simplifiedName: "",
          location: new LngLat(0, 0),
        },
        ...results,
      ]
    : results;

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
        if (isOpen) {
          handleSubmit(controller.field.value);
          setIsOpen(false);
        } else {
          query(value);
          setIsOpen(true);
        }
      }
    } else {
      handleSubmit(controller.field.value, searchOption.location);
      setIsOpen(false);
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchSubmit(controller.field.value, "create-option");
        }}
      >
        <Autocomplete
          className={className}
          id="search-query"
          innerRef={controller.field.ref}
          label={USER_SEARCH}
          helperText={error}
          loading={isLoading}
          options={options?.map((result) => result.name) || []}
          open={isOpen}
          onClose={() => setIsOpen(false)}
          value={controller.field.value}
          getOptionDisabled={(option) => option === SEARCH_PROFILES}
          onInputChange={(_e, value) => controller.field.onChange(value)}
          onChange={(_e, value, reason) => {
            controller.field.onChange(value);
            searchSubmit(value, reason);
          }}
          onBlur={controller.field.onBlur}
          freeSolo
          multiple={false}
          disableClearable
        />
      </form>
    </>
  );
}
