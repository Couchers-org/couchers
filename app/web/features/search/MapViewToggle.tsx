import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import { theme } from "theme";

import { MapViewOptions, MapViews } from "./utils/constants";

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
      size="medium"
      color="primary"
      sx={{
        borderRadius: "20px",
        boxShadow: theme.shadows[4],
        backgroundColor: theme.palette.common.white,
      }}
    >
      <ToggleButton
        value={MapViews.MAP_AND_LIST}
        aria-label={t("search:views.map_and_list")}
        sx={{
          borderRadius: "20px 0 0 20px",
        }}
      >
        {t("search:views.map_and_list")}
      </ToggleButton>
      <ToggleButton
        value={MapViews.LIST_ONLY}
        aria-label={t("search:views.list")}
        sx={{ borderRadius: "0 20px 20px 0" }}
      >
        {t("search:views.list")}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
export default MapViewToggle;
