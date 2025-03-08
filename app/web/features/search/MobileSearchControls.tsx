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

import { SearchOptions } from "./SearchPage";
import SearchTypeRadioGroup from "./SearchTypeRadioGroup";
import { useMapSearchState } from "./state/mapSearchContext";
import {
  MapSearchTypes,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
} from "./utils/constants";

interface MobileSearchControlsProps {
  onClearSearchInputValue: () => void;
  onOpenFilters: () => void;
  onSetSearch: (search: SearchOptions) => void;
  onSetSearchType: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
  totalItems?: number;
  users?: User.AsObject[];
}

const StyledSearchBar = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.common.white,
  width: "100%",
  padding: theme.spacing(2, 2, 0, 2),
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

const MobileSearchControls = ({
  onClearSearchInputValue,
  onOpenFilters,
  onSetSearch,
  onSetSearchType,
  searchType,
  totalItems,
  users,
}: MobileSearchControlsProps) => {
  const { t } = useTranslation([SEARCH]);

  const [keyword, setKeyword] = useState("");

  const {
    hasActiveFilters,
    hasSearchInputValue,
    search: { query },
    zoom,
  } = useMapSearchState();

  const meetsSearchCriteria =
    hasActiveFilters ||
    hasSearchInputValue ||
    zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH;

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
    <StyledSearchBar>
      {searchType === "location" && (
        <StyledLocationAutocompleteOutlined
          defaultValue={query}
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
                    marginRight: query === "" ? theme.spacing(1) : 0,
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
  );
};

export default MobileSearchControls;
