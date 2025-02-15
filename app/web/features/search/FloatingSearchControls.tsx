import { Clear, Tune } from "@mui/icons-material";
import { MenuItem, Select, SelectChangeEvent, styled, Tooltip } from "@mui/material";
import IconButton from "components/IconButton";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { useState } from "react";

import { FilterKey, FilterValue } from "./SearchPage";

interface FloatingSearchNavigationProps {
  hasActiveFilters: boolean;
  isLoading: boolean;
  onClearFilters: () => void;
  onFilterChange: (key: FilterKey, value: FilterValue) => void;
  query: string | undefined;
  showSearchIcon?: boolean;
}

const StyledControlsWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  left: "50%",
  display: "flex",
  alignItems: "center",
}));

const StyledButtonsContainer = styled("div")(({ theme }) => ({
  top: "30px",
  display: "flex",
  position: "relative",
  left: "-50%",
  fontSize: " 14px",
  alignItems: "center",
  justifyContent: "space-between",
  height: "auto",
  zIndex: 10,
  backgroundColor: theme.palette.common.white,
  borderRadius: "50px",
  boxShadow: theme.shadows[2],
  width: "100%",
  border: `3px solid ${theme.palette.primary.main}`,
}));

const StyledFlexRow = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const StyledLocationAutocompleteOutlined = styled(LocationAutocompleteOutlined)(
  ({ theme }) => ({
    maxWidth: "200px",
    "& .MuiInputBase-root": {
      padding: `0 0 0 ${theme.spacing(1)}`,
    },

    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },

    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  }),
);

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: "white",
  borderRadius: "100px",
  border: "none",
  padding: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  height: "40px", // Match height with LocationAutocompleteOutlined

  "& .MuiSelect-select": {
    padding: 0,
  },

  "& .MuiOutlinedInput-root": {
    height: "40px",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },

  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },

  "& .MuiInputBase-root": {
    height: "40px",
  },
}));

const StyledTuneIcon = styled(Tune)<{ hasActiveFilters: boolean }>(
  ({ theme, hasActiveFilters }) => ({
    color: hasActiveFilters
      ? theme.palette.primary.main
      : theme.palette.grey[500],
    padding: `0 ${theme.spacing(1)}`,
    fontSize: "38px",
    cursor: "pointer",

    "&:hover": {
      cursor: "pointer",
      color: hasActiveFilters
        ? theme.palette.secondary.dark
        : theme.palette.primary.light,
    },
  }),
);

const StyledClearIcon = styled(Clear)(({ theme }) => ({
  color: theme.palette.grey[500],
  fontSize: "30px",
  paddingRight: theme.spacing(1),

  "&:hover": {
    cursor: "pointer",
    color: theme.palette.primary.dark,
  },
}));

const FloatingSearchControls = ({
  hasActiveFilters,
  isLoading,
  onClearFilters,
  onFilterChange,
  query,
}: FloatingSearchNavigationProps) => {
  const { t } = useTranslation([SEARCH]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<"location" | "keyword">(
    "location",
  );

  // @TODO(NA) - Instead of search here button just automatically search when moving
  // Put search input here instead



  const handleSearchTypeChange = (event: SelectChangeEvent<unknown>) => {
      const value = event.target.value as "location" | "keyword";
      setSearchType(value);
    };

  return (
    <StyledControlsWrapper>
      <StyledButtonsContainer>
        <StyledFlexRow>
          <StyledLocationAutocompleteOutlined
            defaultValue={query}
            fieldError="" // TODO(NA) - Add error state?
            fullWidth={false}
            placeholder={t("search:form.location_field_label")}
            name="location"
            onChange={onFilterChange}
            showSearchIcon={false}
          />
          <StyledSelect
            labelId="search-type-select"
            id="search-type"
            value={searchType}
            label="search-type"
            onChange={handleSearchTypeChange}
            placeholder="Search Type"
          >
            <MenuItem value="location">Location</MenuItem>
            <MenuItem value="keyword">Keyword</MenuItem>
          </StyledSelect>
        </StyledFlexRow>

        <Tooltip title={t("search:search_filters")}>
          <IconButton
            aria-label={t("search:search_filters")}
            onClick={() => setIsFiltersOpen(true)}
          >
            <StyledTuneIcon hasActiveFilters={hasActiveFilters} />
          </IconButton>
        </Tooltip>
        {hasActiveFilters && (
          <Tooltip title={t("search:clear_filters")}>
            <IconButton
              aria-label={t("search:clear_filters")}
              onClick={onClearFilters}
            >
              <StyledClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </StyledButtonsContainer>
    </StyledControlsWrapper>
  );
};

export default FloatingSearchControls;
