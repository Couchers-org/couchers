import { InputAdornment } from "@material-ui/core";
import IconButton from "components/IconButton";
import { CrossIcon, FilterIcon } from "components/Icons";
import TextField from "components/TextField";
import {
  CLEAR_SEARCH,
  OPEN_FILTER_DIALOG,
  USER_SEARCH,
} from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import useSearchFilters from "features/search/useSearchFilters";
import { useRef, useState } from "react";

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const numParams = Array.from(Object.keys(searchFilters.active)).length;
  const hasFilters = searchFilters.active.query ? numParams > 1 : numParams > 0;

  //prevent default value change warning
  const initialQuery = useRef(searchFilters.active.query).current;

  return (
    <>
      <div className={className}>
        <TextField
          fullWidth
          defaultValue={initialQuery}
          id="search-query"
          label={USER_SEARCH}
          name="query"
          onClick={() => setIsFiltersOpen(true)}
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
                  aria-label={CLEAR_SEARCH}
                  onClick={() => {
                    searchFilters.clear();
                  }}
                  size="small"
                >
                  <CrossIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </div>
      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        searchFilters={searchFilters}
      />
    </>
  );
}
