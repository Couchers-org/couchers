import { Clear, Tune } from "@mui/icons-material";
import {
  alpha,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
  TextField,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import IconButton from "components/IconButton";
import { SearchIcon } from "components/Icons";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { useState } from "react";
import { LngLatLike, MapRef } from "react-map-gl/maplibre";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import { useMapSearchState } from "./state/mapSearchContext";
import { useMapSearchActions } from "./state/useMapSearchActions";
import { MapSearchTypes } from "./utils/constants";
import { getMapBounds } from "./utils/mapUtils";

interface FloatingSearchNavigationProps {
  mapRef: React.RefObject<MapRef>;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  onZoomIn: (
    newZoom: number,
    center?: LngLatLike,
    isLocationSearch?: boolean,
  ) => void;
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

const StyledClearIcon = styled(Clear, {
  shouldForwardProp: (prop) => prop !== "hasActiveFilters",
})<{ hasActiveFilters?: boolean }>(({ theme, hasActiveFilters }) => ({
  color: hasActiveFilters
    ? theme.palette.primary.main
    : theme.palette.grey[500],
  fontSize: "30px",
  paddingRight: theme.spacing(1),
  height: "18px",
  width: "18px",
  padding: 0,
}));

const FloatingSearchControls = ({
  mapRef,
  onClearFilters,
  onOpenFilters,
  onSetSearchType,
  onZoomIn,
  searchType,
}: FloatingSearchNavigationProps) => {
  const { t } = useTranslation([SEARCH]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [keyword, setKeyword] = useState("");

  const {
    search: { query },
    hasActiveFilters,
  } = useMapSearchState();

  const {
    clearKeywordInputValue,
    clearSearchFilters,
    clearSearchInputValue,
    setKeywordInputValue,
    setLocationInputValue,
  } = useMapSearchActions();

  const handleSearchTypeChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as "location" | "keyword";

    onSetSearchType(value);

    if (value === "location") {
      clearKeywordInputValue();

      // clear any previous location values
      const bbox = getMapBounds(mapRef);
      clearSearchInputValue(bbox);
    }
  };

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  const handleKeywordSubmit = () => {
    // Only search if the keyword is longer than 3 characters
    if (keyword.length > 3) {
      setKeywordInputValue(keyword);
    }
  };

  const handleKeyWordEnterPress = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === "Enter") {
      handleKeywordSubmit();
    }
  };

  const handleClearKeyword = () => {
    setKeyword("");
    clearKeywordInputValue();
  };

  const handleLocationChange = (value: GeocodeResult | undefined) => {
    if (value) {
      setLocationInputValue({
        center: [value.location.lng, value.location.lat],
        location: value,
        zoom: 10,
      });

      onZoomIn(10, [value.location.lng, value.location.lat], true);
    }
  };

  const handleClearLocation = () => {
    const bbox = getMapBounds(mapRef);

    clearSearchInputValue(bbox);
  };

  const handleClearSearchFilters = () => {
    onClearFilters();
    clearSearchFilters();
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
              />
            )}
            {searchType === "keyword" && (
              <StyledTextField
                fullWidth={false}
                placeholder={t("search:form.keywords.field_label")}
                name={t("search:form.keywords.field_label")}
                onChange={handleKeywordChange}
                value={keyword}
                onKeyDown={handleKeyWordEnterPress}
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
                                  "search:form.keywords.search_this_keyword_a11y_label",
                                )}
                                onClick={handleKeywordSubmit}
                                size="small"
                                sx={{ marginRight: theme.spacing(1) }}
                              >
                                <SearchIcon />
                              </IconButton>
                              <IconButton
                                aria-label={t(
                                  "search:form.keywords.clear_field_action_a11y_label",
                                )}
                                onClick={handleClearKeyword}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(
                                    theme.palette.primary.light,
                                    0.2,
                                  ), // Adjust opacity as needed
                                }}
                              >
                                <Clear
                                  sx={{
                                    color: theme.palette.primary.main,
                                    fontSize: "20px",
                                  }}
                                />
                              </IconButton>
                            </InputAdornment>
                          </>
                        ),
                      }
                }
              />
            )}

            {!isMobile && (
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
            )}
          </StyledFlexRow>

          <Tooltip title={t("search:form.search_filters")}>
            <IconButton
              aria-label={t("search:form.search_filters")}
              onClick={onOpenFilters}
              size="small"
              sx={{
                ...(hasActiveFilters && {
                  backgroundColor: alpha(theme.palette.primary.light, 0.2), // Adjust opacity as needed
                  marginRight: theme.spacing(0.5),
                }),
              }}
            >
              <StyledTuneIcon hasActiveFilters={hasActiveFilters} />
            </IconButton>
          </Tooltip>
          {hasActiveFilters && (
            <Tooltip title={t("search:form.clear_filters")}>
              <IconButton
                aria-label={t("search:form.clear_filters")}
                onClick={handleClearSearchFilters}
                size="small"
                sx={{
                  ...(hasActiveFilters && {
                    backgroundColor: alpha(theme.palette.primary.light, 0.2), // Adjust opacity as needed
                  }),
                }}
              >
                <StyledClearIcon hasActiveFilters={hasActiveFilters} />
              </IconButton>
            </Tooltip>
          )}
        </StyledButtonsContainer>
      </StyledControlsWrapper>
    </>
  );
};

export default FloatingSearchControls;
