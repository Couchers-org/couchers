import { FormatListBulleted, MapOutlined } from "@mui/icons-material";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { theme } from "theme";

import { MapViewOptions, MapViews } from "./DesktopMapView";

interface MapViewToggleProps {
  mapView: MapViewOptions;
  onMapViewChange: (mapView: MapViewOptions) => void;
}

const MapViewToggle = ({ mapView, onMapViewChange }: MapViewToggleProps) => {
  const { t } = useTranslation([SEARCH]);

  const handleSetMapViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newMapView: MapViewOptions,
  ) => {
    event?.preventDefault();

    onMapViewChange(newMapView);
  };

  return (
    <ToggleButtonGroup
      exclusive
      onChange={handleSetMapViewChange}
      value={mapView}
      aria-label={t("search:views.choose_map_view")}
      size="small"
      color="primary"
    >
      <ToggleButton
        value={MapViews.MAP_AND_LIST}
        aria-label={t("search:views.map_and_list_view")}
        sx={{
          backgroundColor: theme.palette.common.white,
          borderRadius: "20px 0 0 20px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",

          "&.Mui-selected": {
            backgroundColor: theme.palette.common.white,

            "&:hover": {
              backgroundColor: theme.palette.grey[50],
            },
          },

          "&:hover": {
            backgroundColor: theme.palette.grey[50],
            color: theme.palette.primary.dark,
          },
        }}
      >
        <Tooltip title={t("search:views.map_and_list_view")}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormatListBulleted sx={{ fontSize: "18px" }} /> /{" "}
            <MapOutlined sx={{ fontSize: "18px" }} />
          </Box>
        </Tooltip>
      </ToggleButton>
      <ToggleButton
        value={MapViews.LIST_ONLY}
        aria-label={t("search:views.list_only_view")}
        sx={{
          backgroundColor: theme.palette.common.white,
          borderRadius: "0 20px 20px 0",
          borderLeft: `1px solid ${theme.palette.grey[300]} !important`,
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",

          "&.Mui-selected": {
            backgroundColor: theme.palette.common.white,
            "&:hover": {
              backgroundColor: theme.palette.grey[50],
            },
          },

          "&:hover": {
            backgroundColor: theme.palette.grey[50],
            color: theme.palette.primary.dark,
          },
        }}
      >
        <Tooltip title={t("search:views.list_only_view")}>
          <FormatListBulleted sx={{ fontSize: "18px" }} />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
export default MapViewToggle;
