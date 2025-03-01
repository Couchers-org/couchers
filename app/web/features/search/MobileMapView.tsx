import { Clear } from "@mui/icons-material";
import { debounce, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material";
import IconButton from "components/IconButton";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { useState } from "react";
import { theme } from "theme";
import { GeocodeResult } from "utils/hooks";

import { FilterOptions, SearchOptions } from "./SearchPage";
import SearchResultsList from "./SearchResultsList";
import SearchTypeRadioGroup from "./SearchTypeRadioGroup";
import { MapSearchTypes } from "./utils/constants";

interface MobileMapViewProps {
  hasActiveFilters: boolean;
  isLoading?: boolean;
  locationName: string | undefined;
  meetsSearchCriteria: boolean;
  onClearFilters: () => void;
  onClearSearchInputValue: () => void;
  onSetFilters: (filters: FilterOptions) => void;
  onSetSearch: (search: SearchOptions) => void;
  selectedUserIds: number[];
  users: any[] | undefined;
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
  justifyContent: "center",
  alignItems: "flex-start",
  flexDirection: "column",
  overflowY: "auto",
  padding: theme.spacing(0, 2, 4, 2),
}));

const StyledLocationAutocompleteOutlined = styled(LocationAutocompleteOutlined)(
  ({ theme }) => ({
    borderRadius: "50px",

    "& .MuiOutlinedInput-root": {
      borderRadius: "50px",
    },
  }),
);

const StyledTextField = styled(TextField)(({ theme }) => ({
  borderRadius: "50px",

  "& .MuiOutlinedInput-root": {
    borderRadius: "50px",
  },
}));

const MobileMapView = ({
  hasActiveFilters,
  locationName,
  meetsSearchCriteria,
  onClearFilters,
  onClearSearchInputValue,
  onSetFilters,
  onSetSearch,
  isLoading,
  selectedUserIds,
  users,
}: MobileMapViewProps) => {
  const { t } = useTranslation([SEARCH]);

  const [searchType, setSearchType] = useState<MapSearchTypes>("location");
  const [keyword, setKeyword] = useState("");

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as MapSearchTypes);
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
        <SearchTypeRadioGroup
          onChange={handleSearchTypeChange}
          searchType={searchType}
        />
      </StyledSearchBar>
      <StyledResultsWrapper id="styled-results-wrapper">
        <SearchResultsList
          isLoading={isLoading}
          selectedUserIds={selectedUserIds}
          users={users}
          meetsSearchCriteria={meetsSearchCriteria}
        />
      </StyledResultsWrapper>
    </StyledWrapper>
  );
};

export default MobileMapView;
