import ReplayIcon from "@material-ui/icons/Replay";
import TuneIcon from "@material-ui/icons/Tune";
import Button from "components/Button";
import Map from "components/Map";
import {
  addClusteredUsersToMap,
  filterData,
  layers,
  reRenderUsersOnMap,
} from "features/search/users";
import { Feature, GeoJsonProperties, Geometry, Point } from "geojson";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import {
  Event as MaplibreEvent,
  LngLat,
  Map as MaplibreMap,
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
  testContainer: {
    position: "absolute",
    left: "50%",
    width: "100%",
  },
  testChildFromGoogle: {
    width: "300px",
    top: "30px",
    display: "flex",
    position: "relative",
    left: "-50%",
    fontSize: " 14px",
    margin: "8px auto 0",
    alignItems: "center",

    height: "25px",
    zIndex: 10,
  },
  buttonSearchSettings: {
    borderRadius: "0 4px 4px 0",
    "& span": {
      margin: 0,
    },
  },
  searchHereButton: {
    borderRadius: "4px 0 0 4px",
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
}: mapWrapperProps) {
  const { t } = useTranslation([SEARCH]);
  const [areClustersLoaded, setAreClustersLoaded] = useState(false);
  const [isMapStyleLoaded, setIsMapStyleLoaded] = useState(false);
  const [isMapSourceLoaded, setIsMapSourceLoaded] = useState(false);
  const previousResult = usePrevious(selectedResult);
  const classes = useStyles();

  /**
   * User clicks on a user on map
   */
  const handleMapUserClick = useCallback(
    (
      ev: MapMouseEvent & {
        features?: Feature<Geometry, GeoJsonProperties>[] | undefined;
      } & MaplibreEvent
    ) => {
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
    if (isMapStyleLoaded && isMapSourceLoaded && wasSearchPerformed) {
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
  ]);

  /**
   * Clicks on 'search here' button
   */
  const handleOnClick = () => {
    const currentBbox = map.current?.getBounds().toArray();
    if (currentBbox) {
      if (map.current?.getBounds && locationResult) {
        setLocationResult({
          ...locationResult,
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
            loading={isLoading}
            onClick={handleOnClick}
            className={classes.searchHereButton}
            endIcon={<ReplayIcon />}
          >
            {t("search:filter_dialog.search_here_button")}
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
