import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { theme } from "theme";

import { SearchMode, SearchModeOptions } from "./utils/constants";

interface SearchModeToggleProps {
  searchMode: SearchModeOptions;
  onSearchModeChange: (searchMode: SearchModeOptions) => void;
}

const SearchModeToggle = ({ searchMode, onSearchModeChange }: SearchModeToggleProps) => {
  const { t } = useTranslation([SEARCH]);

  const handleSetSearchModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newSearchMode: SearchModeOptions | null,
  ) => {
    event?.preventDefault();

    // Allow deselection - if clicking on the currently selected mode, deselect it
    if (newSearchMode === null || newSearchMode === searchMode) {
      onSearchModeChange(SearchMode.NONE);
    } else {
      onSearchModeChange(newSearchMode);
    }
  };

  return (
    <ToggleButtonGroup
      exclusive
      onChange={handleSetSearchModeChange}
      value={searchMode === SearchMode.NONE ? null : searchMode}
      aria-label={t("search:search_mode.choose_search_mode")}
      size="small"
      color="primary"
      sx={{
        borderRadius: "20px",
        boxShadow: theme.shadows[4],
        backgroundColor: theme.palette.common.white,
      }}
    >
      <ToggleButton
        value={SearchMode.HOSTS}
        aria-label={t("search:search_mode.hosts")}
        sx={{
          borderRadius: "20px 0 0 20px",
        }}
      >
        {t("search:search_mode.hosts")}
      </ToggleButton>
      <ToggleButton
        value={SearchMode.MEETUP}
        aria-label={t("search:search_mode.meetup")}
        sx={{ borderRadius: "0 20px 20px 0" }}
      >
        {t("search:search_mode.meetup")}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default SearchModeToggle; 
