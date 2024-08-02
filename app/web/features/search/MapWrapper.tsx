import maplibregl, { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { addClusteredUsersToMap, layers } from "../search/users";
import { usePrevious } from "utils/hooks";
import { MutableRefObject } from "react";
import { User } from "proto/api_pb";
import Map from "components/Map";
import { filterData } from "../search/users";
import { reRenderUsersOnMap } from "features/search/users";
import { Point } from "geojson";
import { InfiniteData } from "react-query";
import { UserSearchRes } from "proto/search_pb";
import { Dispatch, SetStateAction } from "react";
import makeStyles from "utils/makeStyles";
import Button from "components/Button";

const useStyles = makeStyles((theme) => ({
  searchHereButton: {
    top: "-40rem",
    display: "flex",
    margin: "0 auto",
  },
}));

interface mapWrapperProps {
  selectedResult:
    | Pick<User.AsObject, "username" | "userId" | "lng" | "lat">
    | undefined;
  isLoading: boolean;
  locationResult: any;
  setLocationResult: any;
  results: InfiniteData<UserSearchRes.AsObject> | undefined;
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
  setSelectedResult,
}: mapWrapperProps) {
  const [areClustersLoaded, setAreClustersLoaded] = useState(false);
  // const { locationResult, setLocationResult } = useContext(mapContext); // if behavies weirdly, then use again the initialCoords context variable
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

  //detect when map data has been initially loaded
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

  /**
   * Re-renders users list on map (when results array changed)
   */
  useEffect(() => {
    if (map.current?.loaded()) {
      map.current?.stop();

      if (results) {
        const usersToRender = filterData(results);
        reRenderUsersOnMap(map.current, usersToRender, handleMapUserClick);
      }
    }
  }, [results, map.current, map.current?.loaded()]);

  return (
    <>
      <Map
        grow
        initialCenter={locationResult.Location}
        initialZoom={5}
        postMapInitialize={initializeMap}
        hash
      />

      <Button
        loading={isLoading}
        onClick={handleOnClick}
        className={classes.searchHereButton}
      >
        search here
      </Button>
    </>
  );
}
