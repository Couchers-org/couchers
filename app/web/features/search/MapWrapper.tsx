import maplibregl, { EventData, Map as MaplibreMap } from "maplibre-gl";
import { addClusteredUsersToMap, layers } from "../search/users";
import { reRenderUsersOnMap } from "features/search/users";
import { useCallback, useEffect, useState } from "react";
import ReplayIcon from "@material-ui/icons/Replay";
import { Dispatch, SetStateAction } from "react";
import { UserSearchRes } from "proto/search_pb";
import TuneIcon from "@material-ui/icons/Tune";
import { filterData } from "../search/users";
import { InfiniteData } from "react-query";
import makeStyles from "utils/makeStyles";
import { usePrevious } from "utils/hooks";
import { MutableRefObject } from "react";
import Button from "components/Button";
import { User } from "proto/api_pb";
import Map from "components/Map";
import { Point } from "geojson";
import { SEARCH } from "i18n/namespaces";
import { useTranslation } from "i18n";

const useStyles = makeStyles((theme) => ({
  searchHereGroup2: {
    top: "20px",
    // display: "flex",
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
  selectedResult:
    | Pick<User.AsObject, "username" | "userId" | "lng" | "lat">
    | undefined;
  isLoading: boolean;
  locationResult: any;
  setLocationResult: Dispatch<SetStateAction<any>>;
  results: InfiniteData<UserSearchRes.AsObject> | undefined;
  setIsFiltersOpen: Dispatch<SetStateAction<boolean>>;
  mapInitiallyLocated: boolean;
  setSelectedResult: Dispatch<
    SetStateAction<
      Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined
    >
  >;
  map: MutableRefObject<MaplibreMap | undefined>;
}

export default function MapWrapper({
  map,
  selectedResult,
  locationResult,
  setLocationResult,
  isLoading,
  results,
  mapInitiallyLocated,
  setSelectedResult,
  setIsFiltersOpen,
}: mapWrapperProps) {
  const { t } = useTranslation([SEARCH]);
  const [areClustersLoaded, setAreClustersLoaded] = useState(false);
  const previousResult = usePrevious(selectedResult);
  const classes = useStyles();

  /**
   * User clicks on a user on map
   */
  const handleMapUserClick = useCallback(
    (
      ev: maplibregl.MapMouseEvent & {
        features?: maplibregl.MapboxGeoJSONFeature[] | undefined;
      } & EventData
    ) => {
      ev.preventDefault();

      const props = ev.features?.[0].properties;
      const geom = ev.features?.[0].geometry as Point;

      if (!props || !geom) return;

      const username = props.username;
      const userId = props.id;

      const [lng, lat] = geom.coordinates;
      setSelectedResult({ username, userId, lng, lat });
    },
    []
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
  }, []);

  /**
   * Moves map to selected user's location
   */
  const flyToUser = useCallback((user: Pick<User.AsObject, "lng" | "lat">) => {
    map.current?.stop();
    map.current?.easeTo({
      center: [user.lng, user.lat],
    });
  }, []);

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
  }, [selectedResult, areClustersLoaded, previousResult, flyToUser]);

  useEffect(() => {
    if (!map.current) return;
    const handleMapClickAway = (e: EventData) => {
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
  }, [handleMapUserClick, handleMapSourceData]);

  /**
   * Once map is centered, search in that area
   */
  useEffect(() => {
    if (mapInitiallyLocated) {
      handleOnClick();
    }
  }, [mapInitiallyLocated]);

  /**
   * Re-renders users list on map (when results array changed)
   */
  useEffect(() => {
    if (map.current?.loaded() && mapInitiallyLocated) {
      map.current?.stop();

      if (results) {
        const usersToRender = filterData(results);
        reRenderUsersOnMap(map.current, usersToRender, handleMapUserClick);
      }
    }
  }, [results, map.current, map.current?.loaded(), mapInitiallyLocated]);

  const initializeMap = (newMap: MaplibreMap) => {
    map.current = newMap;
    newMap.on("load", () => {
      addClusteredUsersToMap(newMap);
      handleOnClick();
    });
  };

  /**
   * Clicks on 'search here' button
   */
  const handleOnClick = () => {
    const currentBbox = map.current?.getBounds().toArray() as number[][];
    if (currentBbox) {
      if (map.current?.getBounds) {
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
    }
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
        initialCenter={locationResult.Location}
        initialZoom={5}
        postMapInitialize={initializeMap}
        hash
      />
    </>
  );
}
