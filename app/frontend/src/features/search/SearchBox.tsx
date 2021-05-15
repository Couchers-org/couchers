import { InputAdornment } from "@material-ui/core";
import IconButton from "components/IconButton";
import { FilterIcon } from "components/Icons";
import TextField from "components/TextField";
import { OPEN_FILTER_DIALOG, USER_SEARCH } from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import { searchRoute } from "routes";

export default function SearchBox({ className }: { className?: string }) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { register, handleSubmit, getValues } = useForm<{ query: string }>();

  const history = useHistory();
  const location = useLocation();
  const params = useRef(new URLSearchParams(location.search));

  //this is necessary because we need to set params when opening filter dialog,
  //not only on form submit
  const setParams = () => {
    const query = getValues().query;
    if (query) {
      params.current.set("query", query);
    } else {
      params.current.delete("query");
    }
  };

  const onSubmit = handleSubmit(() => {
    setParams();
    history.push(`${searchRoute}?${params.current.toString()}`);
  });

  return (
    <>
      <form onSubmit={onSubmit}>
        <TextField
          className={className}
          defaultValue={params.current.get("query") || ""}
          id="search-query"
          label={USER_SEARCH}
          name="query"
          inputRef={register}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={OPEN_FILTER_DIALOG}
                  onClick={() => {
                    setParams();
                    setIsFiltersOpen(!isFiltersOpen);
                  }}
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
        searchParams={params.current}
      />
    </>
  );
}
