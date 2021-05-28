import { InputAdornment } from "@material-ui/core";
import IconButton from "components/IconButton";
import { FilterIcon } from "components/Icons";
import TextField from "components/TextField";
import { OPEN_FILTER_DIALOG, USER_SEARCH } from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import useSearchFilters from "features/search/useSearchFilters";
import React, { useRef, useState } from "react";

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchFilters.apply();
  };

  const numParams = Array.from(Object.keys(searchFilters.active)).length;
  const hasFilters = searchFilters.active.query ? numParams > 1 : numParams > 0;

  //prevent default value change warning
  const initialQuery = useRef(searchFilters.active.query).current;

  return (
    <>
      <form onSubmit={handleSubmit} className={className}>
        <TextField
          defaultValue={initialQuery}
          id="search-query"
          label={USER_SEARCH}
          name="query"
          onChange={(event) =>
            searchFilters.change("query", event.target.value)
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={OPEN_FILTER_DIALOG}
                  color={hasFilters ? "primary" : undefined}
                  onClick={() => {
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
        searchFilters={searchFilters}
      />
    </>
  );
}
