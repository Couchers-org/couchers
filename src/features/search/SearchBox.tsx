import classNames from "classnames";
import Button from "components/Button";
import { OPEN_FILTER_DIALOG } from "features/search/constants";
import FilterDialog from "features/search/FilterDialog";
import useSearchFilters from "features/search/useSearchFilters";
import { useState } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    [theme.breakpoints.up("md")]: {
      display: "block",
      margin: "0 auto",
    },
  },
  mobileHide: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
}));

export default function SearchBox({
  className,
  searchFilters,
}: {
  className?: string;
  searchFilters: ReturnType<typeof useSearchFilters>;
}) {
  const classes = useStyles();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsFiltersOpen(true)}
        className={classNames(className, classes.root)}
      >
        {OPEN_FILTER_DIALOG}
      </Button>
      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        searchFilters={searchFilters}
      />
    </>
  );
}
