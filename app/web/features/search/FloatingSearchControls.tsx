import { Clear, Tune } from "@mui/icons-material";
import {
  debounce,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
  TextField,
  Tooltip,
} from "@mui/material";
import IconButton from "components/IconButton";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { useState } from "react";
import { theme } from "theme";

import { FilterKey, FilterValue } from "./SearchPage";

interface FloatingSearchNavigationProps {
  hasActiveFilters: boolean;
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
  padding: theme.spacing(0.5, 1),
}));

const StyledFlexRow = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const sharedInputStyles = () => ({
  height: "40px",
  minWidth: "200px",
  maxWidth: "200px",
  marginLeft: theme.spacing(1),

  "& .MuiInputBase-root": {
    height: "40px",
    minWidth: "200px",
    maxWidth: "200px",

    padding: 0,
  },

  "& .MuiInputBase-input": {
    height: "40px",
    padding: 0,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
});

const StyledLocationAutocompleteOutlined = styled(LocationAutocompleteOutlined)(
  sharedInputStyles,
);

const StyledTextField = styled(TextField)(({ theme }) => ({
  ...sharedInputStyles(), // Apply same styles

  "& .MuiInputBase-input": {
    padding: 0,
    height: "40px",
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: "white",
  borderRadius: "100px",
  border: "none",
  padding: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  height: "40px", // Match height with LocationAutocompleteOutlined
  width: theme.spacing(15),

  "& .MuiSelect-select": {
    padding: 0,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },

  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
}));

const StyledTuneIcon = styled(Tune, {
  shouldForwardProp: (prop) => prop !== "hasActiveFilters",
})<{ hasActiveFilters: boolean }>(({ theme, hasActiveFilters }) => ({
  color: hasActiveFilters
    ? theme.palette.primary.main
    : theme.palette.grey[500],
  fontSize: "38px",
  cursor: "pointer",
  height: "20px",
  width: "20px",
  padding: 0,

  "&:hover": {
    cursor: "pointer",
    color: hasActiveFilters
      ? theme.palette.secondary.dark
      : theme.palette.primary.light,
  },
}));

const StyledClearIcon = styled(Clear)(({ theme }) => ({
  color: theme.palette.grey[500],
  fontSize: "30px",
  paddingRight: theme.spacing(1),
  height: "20px",
  width: "20px",
  padding: 0,

  "&:hover": {
    cursor: "pointer",
    color: theme.palette.primary.dark,
  },
}));

const FloatingSearchControls = ({
  hasActiveFilters,
  onClearFilters,
  onFilterChange,
  query,
}: FloatingSearchNavigationProps) => {
  const { t } = useTranslation([SEARCH]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<"location" | "keyword">(
    "location",
  );

  const handleSearchTypeChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as "location" | "keyword";
    setSearchType(value);
  };

  const handleKeywordChange = debounce(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("keyword", event.target.value);
    },
    500,
  );

  return (
    <StyledControlsWrapper>
      <StyledButtonsContainer>
        <StyledFlexRow>
          {searchType === "location" && (
            <StyledLocationAutocompleteOutlined
              defaultValue={query}
              fullWidth={false}
              placeholder={t("search:form.location_field_label")}
              name="location"
              onChange={onFilterChange}
              showSearchIcon={false}
            />
          )}
          {searchType === "keyword" && (
            <StyledTextField
              fullWidth={false}
              placeholder={t("search:form.keyword_field_label")}
              name="keyword"
              onChange={handleKeywordChange}
            />
          )}

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

        <Tooltip title={t("search:form.search_filters")}>
          <IconButton
            aria-label={t("search:form.search_filters")}
            onClick={() => setIsFiltersOpen(true)}
          >
            <StyledTuneIcon hasActiveFilters={hasActiveFilters} />
          </IconButton>
        </Tooltip>
        {hasActiveFilters && (
          <Tooltip title={t("search:form.clear_filters")}>
            <IconButton
              aria-label={t("search:form.clear_filters")}
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
