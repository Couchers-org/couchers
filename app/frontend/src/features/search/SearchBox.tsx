import { InputAdornment } from "@material-ui/core";
import IconButton from "components/IconButton";
import { CrossIcon, FilterIcon } from "components/Icons";
import TextField from "components/TextField";
import {
  OPEN_FILTER_DIALOG,
  SEARCH,
  USER_SEARCH,
} from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import useSearchFilters from "features/search/useSearchFilters";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { handleSubmit, register, setValue } = useForm();
  const onSubmit = handleSubmit(({ query }) => {
    if (query) {
      searchFilters.change("query", query);
    } else {
      searchFilters.remove("query");
    }
    searchFilters.apply();
  });

  const numParams = Array.from(Object.keys(searchFilters.active)).length;
  const hasFilters = searchFilters.active.query ? numParams > 1 : numParams > 0;

  //prevent default value change warning
  const initialQuery = useRef(searchFilters.active.query).current;

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
                  aria-label={SEARCH}
                  onClick={() => {
                    setValue("query", "", { shouldDirty: true });
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
