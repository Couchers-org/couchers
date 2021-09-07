import { InputAdornment } from "@material-ui/core";
import IconButton from "components/IconButton";
import { CrossIcon, FilterIcon, SearchIcon } from "components/Icons";
import TextField from "components/TextField";
import {
  CLEAR_SEARCH,
  OPEN_FILTER_DIALOG,
  SEARCH,
  USER_SEARCH,
} from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import useSearchFilters from "features/search/useSearchFilters";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { handleSubmit, register, watch, setValue } = useForm({
    mode: "onChange",
  });
  const onSubmit = handleSubmit(() => {
    searchFilters.apply();
  });

  const numParams = Array.from(Object.keys(searchFilters.active)).length;
  const hasFilters = searchFilters.active.query ? numParams > 1 : numParams > 0;

  //prevent default value change warning
  const initialQuery = useRef(searchFilters.active.query).current;

  const watchQuery = watch("query", initialQuery);
  const { change, remove } = searchFilters;
  useEffect(() => {
    if (watchQuery) {
      change("query", watchQuery);
    } else {
      remove("query");
    }
  }, [watchQuery, change, remove]);

  return (
    <>
      <form onSubmit={onSubmit} className={className}>
        <TextField
          fullWidth
          defaultValue={initialQuery}
          id="search-query"
          label={USER_SEARCH}
          name="query"
          inputRef={register}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={SEARCH}
                  onClick={() => {
                    onSubmit();
                  }}
                  size="small"
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  aria-label={OPEN_FILTER_DIALOG}
                  color={hasFilters ? "primary" : undefined}
                  onClick={() => {
                    setIsFiltersOpen(!isFiltersOpen);
                  }}
                  size="small"
                >
                  <FilterIcon />
                </IconButton>
                <IconButton
                  aria-label={CLEAR_SEARCH}
                  onClick={() => {
                    setValue("query", "");
                    searchFilters.clear();
                    onSubmit();
                  }}
                  size="small"
                >
                  <CrossIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </form>
      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        searchFilters={searchFilters}
      />
    </>
  );
}
