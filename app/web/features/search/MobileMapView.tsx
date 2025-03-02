import { Clear, Tune } from "@mui/icons-material";
import {
  debounce,
  InputAdornment,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import IconButton from "components/IconButton";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { useState } from "react";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import PreviousNextPagination from "./PreviousNextPagination";
import { SearchOptions } from "./SearchPage";
import SearchResultsList from "./SearchResultsList";
import SearchTypeRadioGroup from "./SearchTypeRadioGroup";
import { MapSearchTypes } from "./utils/constants";

interface MobileMapViewProps {
  hasActiveFilters: boolean;
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading?: boolean;
  locationName: string | undefined;
  meetsSearchCriteria: boolean;
  onClearSearchInputValue: () => void;
  onOpenFilters: () => void;
  onLoadNextPage: () => void;
  onLoadPreviousPage: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  totalItems?: number;
  users: User.AsObject[];
}

const StyledWrapper = styled("div")({
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const StyledSearchBar = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.common.white,
  width: "100%",
  padding: theme.spacing(2, 2, 0, 2),
}));

const StyledResultsWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexDirection: "column",
  overflowY: "auto",
  padding: theme.spacing(0, 2, 4, 2),
}));

const StyledLocationAutocompleteOutlined = styled(LocationAutocompleteOutlined)(
  ({ theme }) => ({
    "& div > .MuiInputBase-root": {
      borderRadius: "50px",
    },
  }),
);

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "50px",
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

const MobileMapView = ({
  hasActiveFilters,
  hasNextPage,
  hasPreviousPage,
  locationName,
  meetsSearchCriteria,
  onClearSearchInputValue,
  onLoadNextPage,
  onLoadPreviousPage,
  onOpenFilters,
  onSetSearch,
  onSetSearchType,
  searchType,
  isLoading,
  totalItems,
  users,
}: MobileMapViewProps) => {
  const { t } = useTranslation([SEARCH]);

  const [keyword, setKeyword] = useState("");

  const handleSearchTypeChange = (value: string) => {
    onSetSearchType(value as MapSearchTypes);
  };

  const debouncedKeywordChange = debounce((value: SearchOptions["keyword"]) => {
    onSetSearch({ keyword: value });
  }, 500);

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedKeywordChange(event.target.value);
    setKeyword(event.target.value);
  };

  const handleClearKeyword = () => {
    setKeyword("");
    onSetSearch({ keyword: "" });
  };

  const handleLocationChange = (value: GeocodeResult | undefined) => {
    onSetSearch({ location: value });
  };

  const handleClearLocation = () => {
    onClearSearchInputValue();
  };

  return (
    <StyledWrapper id="styled-wrapper">
      <StyledSearchBar>
        {searchType === "location" && (
          <StyledLocationAutocompleteOutlined
            defaultValue={locationName}
            fullWidth
            placeholder={t("search:form.location_field_label")}
            name="location"
            onChange={handleLocationChange}
            onClear={handleClearLocation}
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label={t("search:form.search_filters")}
                  onClick={onOpenFilters}
                >
                  <StyledTuneIcon hasActiveFilters={hasActiveFilters} />
                </IconButton>
              ),
            }}
          />
        )}
        {searchType === "keyword" && (
          <StyledTextField
            fullWidth
            placeholder={t("search:form.keywords.field_label")}
            name={t("search:form.keywords.field_label")}
            onChange={handleKeywordChange}
            value={keyword}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <>
                  <InputAdornment
                    position="end"
                    sx={{
                      marginRight: locationName === "" ? theme.spacing(1) : 0,
                    }}
                  >
                    {keyword.length > 0 && (
                      <IconButton
                        aria-label={t(
                          "search:form.keywords.clear_field_action_a11y_label",
                        )}
                        onClick={handleClearKeyword}
                        size="small"
                      >
                        <Clear sx={{ fontSize: "20px" }} />
                      </IconButton>
                    )}
                    <IconButton
                      aria-label={t("search:form.search_filters")}
                      onClick={onOpenFilters}
                    >
                      <StyledTuneIcon hasActiveFilters={hasActiveFilters} />
                    </IconButton>
                  </InputAdornment>
                </>
              ),
            }}
          />
        )}
        <SearchTypeRadioGroup
          onChange={handleSearchTypeChange}
          searchType={searchType}
        />
        <Typography
          variant="caption"
          sx={{
            marginTop: theme.spacing(2),
            display: "flex",
            justifyContent: "center",
          }}
        >
          {!meetsSearchCriteria
            ? null
            : !users
              ? t("search:search_result.no_user_result_message")
              : t("search:search_result.users_found_message", {
                  totalItems,
                })}
        </Typography>
      </StyledSearchBar>
      <StyledResultsWrapper>
        <SearchResultsList
          isLoading={isLoading}
          users={users}
          meetsSearchCriteria={meetsSearchCriteria}
        />
        <PreviousNextPagination
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          hasUsers={!!users}
          meetsSearchCriteria={meetsSearchCriteria}
          onPreviousClick={onLoadPreviousPage}
          onNextClick={onLoadNextPage}
          totalItems={totalItems}
        />
      </StyledResultsWrapper>
    </StyledWrapper>
  );
};

export default MobileMapView;
