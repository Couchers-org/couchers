import maplibregl, { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { addClusteredUsersToMap, layers } from "../search/users";
import { usePrevious } from "utils/hooks";
import { User } from "proto/api_pb";
import Map from "components/Map";
import { Point } from "geojson";

import { mapContext } from "./new-search-page-controller";

export default function NewMapWrapper() {
  const map = useRef<MaplibreMap>();
  const [selectedResult, setSelectedResult] = useState<Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined>(undefined);
  const [initialCoords] = useContext(mapContext);
  const previousResult = usePrevious(selectedResult);

  const [areClustersLoaded, setAreClustersLoaded] = useState(false);

  const showResults = useRef(false);

  // const searchFilters = useRouteWithSearchFilters(searchRoute);

  // const updateMapBoundingBox = alert("updated map bounding box");

  /*
  useEffect(() => {
    if (showResults.current !== searchFilters.any) {
      showResults.current = searchFilters.any;
      setTimeout(() => {
        map.current?.resize();
      }, theme.transitions.duration.standard);
    }
  }, [searchFilters.any, selectedResult, theme.transitions.duration.standard]);
  */

  const flyToUser = () => { alert("pending to implement :)") };

  useEffect(() => {
    //unset the old feature selection on the map for styling
    if (previousResult) {
      areClustersLoaded &&
        map.current?.setFeatureState(
          { source: "clustered-users", id: previousResult.userId },
          { selected: false }
        );
    }

    if (selectedResult) {
      flyToUser();
      areClustersLoaded &&
        map.current?.setFeatureState(
          { source: "clustered-users", id: selectedResult.userId },
          { selected: true }
        );

      //update result list
      document
        .getElementById(`search-result-${selectedResult.userId}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedResult, areClustersLoaded, previousResult, flyToUser]);

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
      //defaultPrevented is true when a map feature has been clicked
      if (!e.defaultPrevented) {
        setSelectedResult(undefined);
      }
    };

    //bind event handlers for map events (order matters!)
    map.current.on(
      "click",
      layers.unclusteredPointLayer.id,
      handleMapUserClick
    );
    map.current.on("click", handleMapClickAway);

    map.current.on("sourcedata", handleMapSourceData);

    return () => {
      if (!map.current) return;

      //unbind event handlers for map events
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
    });
  };

  return <Map
    grow
    initialCenter={initialCoords}
    initialZoom={5}
    postMapInitialize={initializeMap}
    hash
  />
}
