import { MutableRefObject, useState } from "react";
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
import { Map as MaplibreMap } from "maplibre-gl";

import MapView from "./MapView";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { Coordinates } from "./utils/constants";

const DEFAULT_DRAWER_WIDTH = 400;

interface DesktopMapViewProps {
  bbox: Coordinates;
  isLoading: boolean;
  onClearFilters: () => void;
  onFilterChange: (key: FilterKey, value: FilterValue) => void;
  query: string | undefined;
  map: MutableRefObject<MaplibreMap | undefined>;
  selectedUserId: number | undefined;
  users: User.AsObject[] | undefined;
  wasSearchPerformed: boolean | undefined;
}

const StyledMapContainer = styled("div")(({ theme }) => () => ({
  display: "flex",
  position: "fixed",
  top: theme.shape.navPaddingXs,
  left: 0,
  bottom: 0,
  right: 0,
  height: "100%",
  width: "100%",

  [theme.breakpoints.up("sm")]: {
    top: theme.shape.navPaddingSmUp,
  },
}));

const CenteredContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));

const DrawerContainer = styled("div")<{ drawerWidth: number }>(
  ({ theme, drawerWidth }) => ({
    display: "flex",
    width: `${drawerWidth}px`,
    height: "100%",
  }),
);

const MapContainer = styled("div")<{ drawerWidth: number }>(
  ({ theme, drawerWidth }) => ({
    display: "flex",
    width: `calc(100% - ${drawerWidth}px)`,
    position: "relative", // Make sure child elements are positioned relative to this container
  }),
);

const DesktopMapView = ({
  bbox,
  isLoading,
  onClearFilters,
  onFilterChange,
  query,
  map,
  selectedUserId,
  users,
  wasSearchPerformed,
}: DesktopMapViewProps) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);

  const handleDrawerWidthChange = (width: number) => {
    setDrawerWidth(width);
  };

  return (
    <>
      <StyledMapContainer>
        <DrawerContainer drawerWidth={drawerWidth}>
          <ResizeableDrawer
            drawerWidth={drawerWidth}
            onDrawerWidthChange={handleDrawerWidthChange}
          >
            <CenteredContainer>
              <LocationAutocompleteOutlined
                defaultValue={query}
                fieldError=""
                fullWidth={false}
                placeholder={t("search:form.location_field_label")}
                name="location"
                onChange={onFilterChange}
                onClear={onClearFilters}
              />
              <MapSearchType onChange={onFilterChange} />
              {isLoading ? (
                <CenteredSpinner />
              ) : (
                <>
                  <Typography
                    variant="caption"
                    sx={{ marginTop: theme.spacing(2) }}
                  >
                    {!users
                      ? t("search:search_result.no_user_result_message")
                      : t("search:search_result.users_found_message", {
                          count: users.length,
                        })}
                  </Typography>
                  <SearchResultsList
                    selectedUserId={selectedUserId}
                    users={users}
                  />
                </>
              )}
            </CenteredContainer>
          </ResizeableDrawer>
        </DrawerContainer>
        <MapContainer drawerWidth={drawerWidth}>
          <MapView
            bbox={bbox}
            isLoading={isLoading}
            map={map}
            onFiltersChange={onFilterChange}
            selectedUserId={selectedUserId}
            users={users}
            wasSearchPerformed={wasSearchPerformed}
          />
        </MapContainer>
      </StyledMapContainer>
    </>
  );
};

export default DesktopMapView;
