import { Clear, Tune } from "@mui/icons-material";
import {
  debounce,
  InputAdornment,
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
import { GeocodeResult } from "utils/hooks";

import FilterDialog from "./FilterDialog";
import { FilterOptions } from "./SearchPage";

interface FloatingSearchNavigationProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onClearLocation: () => void;
  onSetFilters: (filters: FilterOptions) => void;
  query: string | undefined;
  showSearchIcon?: boolean;
}

const StyledControlsWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

const StyledButtonsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  position: "relative",
  fontSize: " 14px",
  alignItems: "center",
  justifyContent: "space-between",
  height: "auto",
  backgroundColor: theme.palette.common.white,
  borderRadius: "50px",
  boxShadow: theme.shadows[4],
  width: "100%",
  padding: theme.spacing(0.5, 1),
}));

const StyledFlexRow = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const sharedInputStyles = () => ({
  height: "40px",
  minWidth: "250px",
  maxWidth: "250px",
  marginLeft: theme.spacing(1),

  "& .MuiInputBase-root": {
    height: "40px",
    minWidth: "250px",
    maxWidth: "250px",

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
  ...sharedInputStyles(),

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
  onClearLocation,
  onSetFilters,
  query,
}: FloatingSearchNavigationProps) => {
  const { t } = useTranslation([SEARCH]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchType, setSearchType] = useState<"location" | "keyword">(
    "location",
  );
  const [keyword, setKeyword] = useState("");

  const handleSearchTypeChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as "location" | "keyword";
    setSearchType(value);
  };

  const debouncedKeywordChange = debounce((value: string) => {
    onSetFilters({ keyword: value });
  }, 500);

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedKeywordChange(event.target.value);
    setKeyword(event.target.value);
  };

  const handleClearKeyword = () => {
    setKeyword("");
    onSetFilters({ keyword: "" });
  };

  const handleLocationChange = (value: GeocodeResult | undefined) => {
    onSetFilters({ location: value });
  };

  const handleClearLocation = () => {
    onClearLocation();
  };

  const handleCloseDialog = () => {
    setIsFiltersOpen(false);
  };

  return (
    <>
      <StyledControlsWrapper>
        <StyledButtonsContainer>
          <StyledFlexRow>
            {searchType === "location" && (
              <StyledLocationAutocompleteOutlined
                defaultValue={query}
                fullWidth={false}
                placeholder={t("search:form.location_field_label")}
                name="location"
                onChange={handleLocationChange}
                onClear={handleClearLocation}
                showSearchIcon={false}
              />
            )}
            {searchType === "keyword" && (
              <StyledTextField
                fullWidth={false}
                placeholder={t("search:form.keywords.field_label")}
                name={t("search:form.keywords.field_label")}
                onChange={handleKeywordChange}
                value={keyword}
                InputProps={
                  keyword.length < 1
                    ? {}
                    : {
                        endAdornment: (
                          <>
                            <InputAdornment
                              position="end"
                              sx={{
                                marginRight:
                                  query === "" ? theme.spacing(1) : 0,
                              }}
                            >
                              <IconButton
                                aria-label={t(
                                  "search:form.keywords.clear_field_action_a11y_label",
                                )}
                                onClick={handleClearKeyword}
                                size="small"
                              >
                                <Clear sx={{ fontSize: "20px" }} />
                              </IconButton>
                            </InputAdornment>
                          </>
                        ),
                      }
                }
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
      <FilterDialog
        isOpen={isFiltersOpen}
        onCloseDialog={handleCloseDialog}
        onSetFilters={onSetFilters}
      />
    </>
  );
};

export default FloatingSearchControls;
