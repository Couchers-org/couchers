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
import { FilterOptions, SearchQueryOptions } from "./SearchPage";

interface FloatingSearchNavigationProps {
  hasActiveFilters: boolean;
  locationName: string | undefined;
  onClearFilters: () => void;
  onClearSearchQuery: () => void;
  onSetFilters: (filters: FilterOptions) => void;
  onSetSearchQuery: (searchQuery: SearchQueryOptions) => void;
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
  onClearSearchQuery,
  onSetFilters,
  onSetSearchQuery,
  locationName,
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

  const debouncedKeywordChange = debounce(
    (value: SearchQueryOptions["keyword"]) => {
      onSetSearchQuery({ keyword: value });
    },
    500,
  );

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedKeywordChange(event.target.value);
    setKeyword(event.target.value);
  };

  const handleClearKeyword = () => {
    setKeyword("");
    onSetSearchQuery({ keyword: "" });
  };

  const handleLocationChange = (value: GeocodeResult | undefined) => {
    onSetSearchQuery({ location: value });
  };

  const handleClearLocation = () => {
    onClearSearchQuery();
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
                defaultValue={locationName}
                fullWidth={false}
                placeholder={t("search:form.location_field_label")}
                name="location"
                onChange={handleLocationChange}
                onClear={handleClearLocation}
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
                                  locationName === "" ? theme.spacing(1) : 0,
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
              <MenuItem value="location">{t("search:location")}</MenuItem>
              <MenuItem value="keyword">{t("search:keyword")}</MenuItem>
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
