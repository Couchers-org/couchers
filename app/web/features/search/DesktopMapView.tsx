import { styled, Typography } from "@mui/material";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import ResizeableDrawer from "components/ResizeableDrawer";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { FilterKey, FilterValue } from "./SearchPage";
import MapSearchType from "./MapSearchType";
import { User } from "proto/api_pb";
import SearchResultsList from "./SearchResultsList";
import { theme } from "theme";

const StyledMapContainer = styled("div")(({ theme }) => ({}) => ({
  display: "flex",
  alignContent: "stretch",
  flexDirection: "column-reverse",
  position: "fixed",
  top: theme.shape.navPaddingXs,
  left: 0,
  right: 0,
  bottom: 0,
  [theme.breakpoints.up("sm")]: {
    top: theme.shape.navPaddingSmUp,
  },
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
  },
  zIndex: 100,
}));

const CenteredContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));

const DesktopMapView = ({
  onFilterChange,
  query,
  users,
}: {
  onFilterChange: (key: FilterKey, value: FilterValue) => void;
  query: string | undefined;
  users: User.AsObject[] | undefined;
}) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);

  return (
    <StyledMapContainer>
      <ResizeableDrawer>
        <CenteredContainer>
          <LocationAutocompleteOutlined
            defaultValue={query}
            fieldError=""
            fullWidth={false}
            placeholder={t("search:form.location_field_label")}
            name="location"
            onChange={onFilterChange}
          />
          <MapSearchType onChange={onFilterChange} />
          <Typography variant="caption" sx={{ marginTop: theme.spacing(2) }}>
            {!users
              ? t("search:search_result.no_user_result_message")
              : t("search:search_result.users_found_message", {
                  count: users.length,
                })}
          </Typography>
          <SearchResultsList users={users} />
        </CenteredContainer>
      </ResizeableDrawer>
    </StyledMapContainer>
  );
};

export default DesktopMapView;
