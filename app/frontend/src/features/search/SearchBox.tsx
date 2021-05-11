import { InputAdornment } from "@material-ui/core";
import IconButton from "components/IconButton";
import { FilterIcon } from "components/Icons";
import TextField from "components/TextField";
import { OPEN_FILTER_DIALOG, USER_SEARCH } from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import { searchRoute } from "routes";

export default function SearchBox({ className }: { className?: string }) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { register, handleSubmit } = useForm<{ query: string }>();

  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const onSubmit = handleSubmit(({ query }: { query: string }) => {
    console.log(query);
    params.set("query", query);
    history.push(`${searchRoute}?${params.toString()}`);
  });

  return (
    <>
      <form onSubmit={onSubmit}>
        <TextField
          className={className}
          defaultValue={params.get("query") || ""}
          id="search-query"
          label={USER_SEARCH}
          name="query"
          inputRef={register}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={OPEN_FILTER_DIALOG}
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </form>
      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
      />
    </>
  );
}
