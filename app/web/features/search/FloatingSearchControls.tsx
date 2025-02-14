import { Clear, Tune } from "@mui/icons-material";
import { styled, Tooltip } from "@mui/material";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { useState } from "react";
import { theme } from "theme";

import { FilterKey, FilterValue } from "./SearchPage";

interface FloatingSearchNavigationProps {
  hasActiveFilters: boolean;
  isLoading: boolean;
  onClearFilters: () => void;
  onFilterChange: (key: FilterKey, value: FilterValue) => void;
}

const StyledControlsWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  left: "50%",
}));

const StyledButtonsContainer = styled("div")(({ theme }) => ({
  top: "30px",
  display: "flex",
  position: "relative",
  left: "-50%",
  fontSize: " 14px",
  margin: "8px auto 0",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(0, 2),
  height: "45px",
  zIndex: 10,
  backgroundColor: theme.palette.primary.main,
  borderRadius: "25px",
  boxShadow: theme.shadows[2],
}));

const StyledFlexRow = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const FloatingSearchControls = ({
  hasActiveFilters,
  isLoading,
  onClearFilters,
  onFilterChange,
}: FloatingSearchNavigationProps) => {
  const { t } = useTranslation([SEARCH]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // @TODO(NA) - Instead of search here button just automatically search when moving
  // Put search input here instead

  return (
    <StyledControlsWrapper>
      <StyledButtonsContainer>
        <StyledFlexRow>SEARCH INPUT</StyledFlexRow>
        <Tooltip title={t("search:search_filters")}>
          <Tune
            aria-label={t("search:search_filters")}
            onClick={() => setIsFiltersOpen(true)}
            sx={{
              color: hasActiveFilters
                ? theme.palette.secondary.light
                : theme.palette.common.white,
              padding: `0 ${theme.spacing(1)}`,
              fontSize: "35px",
              cursor: "pointer",

              "&:hover": {
                cursor: "pointer",
                color: hasActiveFilters
                  ? theme.palette.secondary.dark
                  : theme.palette.primary.light,
              },
            }}
          />
        </Tooltip>
        {hasActiveFilters && (
          <Tooltip title={t("search:clear_filters")}>
            <Clear
              aria-label={t("search:clear_filters")}
              onClick={onClearFilters}
              sx={{
                color: theme.palette.common.white,
                fontSize: "20px",

                "&:hover": {
                  cursor: "pointer",
                  color: theme.palette.primary.light,
                },
              }}
            />
          </Tooltip>
        )}
      </StyledButtonsContainer>
    </StyledControlsWrapper>
  );
};

export default FloatingSearchControls;
