import ReplayIcon from "@mui/icons-material/Replay";
import TuneIcon from "@mui/icons-material/Tune";
import { useMediaQuery, useTheme } from "@mui/material";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Map from "components/Map";
import {
  addClusteredUsersToMap,
  filterData,
  layers,
  reRenderUsersOnMap,
} from "features/search/users";
import { Point } from "geojson";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import {
  LngLat,
  Map as MaplibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from "maplibre-gl";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { InfiniteData } from "react-query";
import { GeocodeResult, usePrevious } from "utils/hooks";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  searchHereGroup2: {
    top: "20px",
    left: "50%",
    position: "relative",
    zIndex: 10,
  },
  mapLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  testContainer: {
    position: "absolute",
    left: "50%",
    width: "100%",
  },
  testChildFromGoogle: {
    width: "365px",
    top: "30px",
    display: "flex",
    position: "relative",
    left: "-50%",
    fontSize: " 14px",
    margin: "8px auto 0",
    alignItems: "center",
    height: "25px",
    zIndex: 1,
  },
  searchHereButton: {
    borderRadius: "4px",
    marginRight: theme.spacing(1),
  },
  clearFiltersButton: {
    borderRadius: "4px",
    marginRight: theme.spacing(1),
  },
  buttonSearchSettings: {
    borderRadius: "4px",
    "& span": {
      margin: 0,
    },
  },
}));

interface mapWrapperProps {
  selectedResult: Pick<User.AsObject, "userId" | "lng" | "lat"> | undefined;
  isLoading: boolean;
  locationResult: GeocodeResult | undefined;
  setLocationResult: Dispatch<SetStateAction<GeocodeResult>>;
  results: InfiniteData<UserSearchRes.AsObject> | undefined;
  setIsFiltersOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedResult: Dispatch<
    SetStateAction<Pick<User.AsObject, "userId" | "lng" | "lat"> | undefined>
  >;
  map: MutableRefObject<MaplibreMap | undefined>;
  setWasSearchPerformed: Dispatch<SetStateAction<boolean>>;
  wasSearchPerformed: boolean;
  areFiltersCleared: boolean;
  onClearFiltersClick: () => void;
}

export default function MapWrapper({
  map,
  selectedResult,
  locationResult,
  setLocationResult,
  isLoading,
  results,
  setSelectedResult,
  setIsFiltersOpen,
  wasSearchPerformed,
  setWasSearchPerformed,
  areFiltersCleared,
  onClearFiltersClick,
}: mapWrapperProps) {
  const { t } = useTranslation([SEARCH]);
  const [areClustersLoaded, setAreClustersLoaded] = useState(false);
  const [isMapStyleLoaded, setIsMapStyleLoaded] = useState(false);
  const [isMapSourceLoaded, setIsMapSourceLoaded] = useState(false);
  const previousResult = usePrevious(selectedResult);
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /**
   * User clicks on a user on map
   */
  const handleMapUserClick = useCallback(
    (ev: MapLayerMouseEvent) => {
      ev.preventDefault();

      const props = ev.features?.[0].properties;
      const geom = ev.features?.[0].geometry as Point;

      if (!props || !geom) return;

      const userId = props.id;

      const [lng, lat] = geom.coordinates;
      setSelectedResult({ userId, lng, lat });
    },
    [setSelectedResult]
  );

  /**
   * Detects when map data has been initially loaded
   */
  const handleMapSourceData = useCallback(() => {
    if (
      map.current &&
      map.current.getSource("clustered-users") &&
      map.current.isSourceLoaded("clustered-users")
    ) {
      setAreClustersLoaded(true);

      // unbind the event
      map.current.off("sourcedata", handleMapSourceData);
    }
  }, [map]);

  /**
   * Moves map to selected user's location
   */
  const flyToUser = useCallback(
    (user: Pick<User.AsObject, "lng" | "lat">) => {
      map.current?.stop();
      map.current?.easeTo({
        center: [user.lng, user.lat],
      });
    },
    [map]
  );

  /**
   * Centers selected user
   * Unsets previous selected
   */
  useEffect(() => {
    //unset the old feature selection on the map for styling
    if (previousResult) {
      if (areClustersLoaded) {
        map.current?.setFeatureState(
          { source: "clustered-users", id: previousResult.userId },
          { selected: false }
        );
      }
    }

    if (selectedResult) {
      flyToUser(selectedResult);
      if (areClustersLoaded) {
        map.current?.setFeatureState(
          { source: "clustered-users", id: selectedResult.userId },
          { selected: true }
        );
      }

      //update result list
      document
        .getElementById(`search-result-${selectedResult.userId}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedResult, areClustersLoaded, previousResult, flyToUser, map]);

  useEffect(() => {
    if (!map.current) return;
    const handleMapClickAway = (e: MapMouseEvent) => {
      // DefaultPrevented is true when a map feature has been clicked
      if (!e.defaultPrevented) {
        setSelectedResult(undefined);
      }
    };

    // Bind event handlers for map events (order matters!)
    map.current.on(
      "click",
      layers.unclusteredPointLayer.id,
      handleMapUserClick
    );

    map.current.on("click", handleMapClickAway);

    map.current.on("sourcedata", handleMapSourceData);

    return () => {
      if (!map.current) return;

      // Unbind event handlers for map events
      map.current.off("sourcedata", handleMapSourceData);
      map.current.off("click", handleMapClickAway);
      map.current.off(
        "click",
        layers.unclusteredPointLayer.id,
        handleMapUserClick
      );
    };
  }, [handleMapUserClick, handleMapSourceData, map, setSelectedResult]);

  /**
   * Re-renders users list on map (when results array changed)
   */
  useEffect(() => {
    if (
      isMapStyleLoaded &&
      isMapSourceLoaded &&
      (wasSearchPerformed || areFiltersCleared)
    ) {
      if (results) {
        const usersToRender = filterData(results);
        reRenderUsersOnMap(map.current!, usersToRender, handleMapUserClick);
      }
    }
  }, [
    results,
    handleMapUserClick,
    map,
    isMapStyleLoaded,
    isMapSourceLoaded,
    wasSearchPerformed,
    areFiltersCleared,
  ]);

  /**
   * Clicks on 'search here' button
   */
  const handleSearchOnClick = () => {
    const currentBbox = map.current?.getBounds().toArray();
    if (currentBbox) {
      if (map.current?.getBounds && locationResult) {
        // Reset location but persist map position
        setLocationResult({
          location: new LngLat(0, 0),
          name: "",
          simplifiedName: "",
          bbox: [
            currentBbox[0][0],
            currentBbox[0][1],
            currentBbox[1][0],
            currentBbox[1][1],
          ],
        });
      }
      setWasSearchPerformed(true);
    }
  };

  /**
   * Clicks on 'clear filters' button
   */
  const handleClearFiltersClick = () => {
    onClearFiltersClick();
  };

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      addClusteredUsersToMap(newMap);
    });

    newMap.on("styledata", function () {
      setIsMapStyleLoaded(true);
    });

    newMap.on("sourcedataloading", function (e) {
      if (e.sourceId === "clustered-users") {
        setIsMapSourceLoaded(true);
      }
    });
  };

  return (
    <>
      <div className={classes.testContainer}>
        <div className={classes.testChildFromGoogle}>
          <Button
            color="primary"
            disabled={isLoading}
            onClick={handleSearchOnClick}
            className={classes.searchHereButton}
            endIcon={<ReplayIcon />}
          >
            {isMobile
              ? t("search:filter_dialog.mobile_search_here_button")
              : t("search:filter_dialog.desktop_search_here_button")}
          </Button>
          <Button
            color="primary"
            disabled={areFiltersCleared}
            onClick={handleClearFiltersClick}
            className={classes.clearFiltersButton}
          >
            {t("search:filter_dialog.clear_filters_button")}
          </Button>
          <Button
            color="primary"
            aria-label="tune search"
            onClick={() => setIsFiltersOpen(true)}
            className={classes.buttonSearchSettings}
            endIcon={<TuneIcon />}
          />
        </div>
      </div>
      {isLoading && (
        <div className={classes.mapLoadingContainer}>
          <CenteredSpinner minHeight="100%" />
        </div>
      )}
      <Map
        grow
        initialCenter={new LngLat(0, 0)}
        initialZoom={1}
        postMapInitialize={initializeMap}
        hash
      />
    </>
  );
}
