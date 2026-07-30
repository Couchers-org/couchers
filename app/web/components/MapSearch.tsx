import { Box, IconButton, styled } from "@mui/material";
import { AutocompleteChangeReason } from "@mui/material/Autocomplete";
import { SignupAccountInputs } from "features/auth/signup/AccountForm";
import { EditProfileFormValues } from "features/profile/edit/EditProfile";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { LngLat } from "maplibre-gl";
import React, { useEffect, useState } from "react";
import { ControllerRenderProps, FieldError } from "react-hook-form";
import { useGeocodeQuery } from "utils/hooks";

import Autocomplete from "./Autocomplete";
import { SearchIcon } from "./Icons";

const StyledBox = styled(Box)(({ theme }) => ({
  "& *": {
    opacity: 1,
  },
  "& .MuiAutocomplete-input": {
    fontSize: "0.75rem",
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.65rem",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.75rem",
  },
  background: "var(--mui-palette-background-default)",
  borderRadius: theme.shape.borderRadius * 3,
  left: 10,
  opacity: 0.9,
  padding: theme.spacing(1),
  position: "absolute",
  top: 10,
  width: "70%",
  zIndex: 1,
}));

const StyledForm = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
}));

interface MapSearchProps {
  setError: (error: string) => void;
  setResult: (lngLat: LngLat, address: string, simplifiedAddress: string) => void;
  inputFieldProps?:
    | ControllerRenderProps<SignupAccountInputs, "location">
    | ControllerRenderProps<EditProfileFormValues, "location">;
  inputFieldError?: FieldError;
}

export default function MapSearch({ setError, setResult, inputFieldProps, inputFieldError }: MapSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const { t } = useTranslation([GLOBAL]);

  // This widget sets the location stored on a user's profile (signup and profile
  // edit), so later we won't accept results from the legacy fallback provider —
  // those have no provider id
  const { query, isLoading, results, error, isProviderUnavailable } =
    useGeocodeQuery({ allowFallback: true /*false*/ });

  //create a dummy search options if there are no results
  const searchOptions = isLoading
    ? []
    : results && results.length === 0
      ? [
          {
            location: new LngLat(0, 0),
            name: t("global:components.edit_location_map.no_location_results_text"),
            simplifiedName: "",
          },
        ]
      : results;

  const errorMessage = isProviderUnavailable
    ? t("global:location_autocomplete.provider_unavailable")
    : error || "";

  useEffect(() => {
    setError(errorMessage);
    if (errorMessage) setOpen(false);
  }, [errorMessage, setError]);

  const searchSubmit = (value: string, reason: AutocompleteChangeReason) => {
    if (reason === "blur") {
      setOpen(false);
      return;
    }
    const searchOption = results?.find((o) => value === o.name);

    if (!searchOption) {
      //createOption is when enter is pressed on user-entered string
      if (reason === "createOption") {
        query(value);
        setOpen(true);
      }
    } else {
      setResult(searchOption.location, searchOption.name, searchOption.simplifiedName);
      setOpen(false);
    }
  };

  return (
    <StyledBox>
      <StyledForm>
        <Autocomplete
          id="map-search"
          label={t("global:components.edit_location_map.search_location_label")}
          value={value}
          size="small"
          options={searchOptions?.map((o) => o.name) || []}
          loading={isLoading}
          open={open}
          onBlur={() => setOpen(false)}
          inputProps={inputFieldProps}
          error={inputFieldError?.message}
          onInputChange={(e, v) => setValue(v)}
          onChange={(e, v, reason) => {
            setValue(v);
            searchSubmit(v, reason);
          }}
          freeSolo
          multiple={false}
          // show all returned results, don't do a filter client side
          filterOptions={(x) => x}
          disableClearable
          sx={{ flexGrow: 1 }}
          getOptionDisabled={(option) => option === t("global:components.edit_location_map.no_location_results_text")}
          helperText={t("global:components.edit_location_map.press_enter_to_search")}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchSubmit(value, "createOption");
          }}
        />
        <IconButton
          aria-label={t("global:location_autocomplete.search_location_button")}
          size="medium"
          onClick={() => {
            searchSubmit(value, "createOption");
          }}
        >
          <SearchIcon />
        </IconButton>
      </StyledForm>
    </StyledBox>
  );
}
