import maplibregl, { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { addClusteredUsersToMap, layers } from "../search/users"; // TODO: here?
import { usePrevious } from "utils/hooks";
import { MutableRefObject } from "react";
import { User } from "proto/api_pb";
import Map from "components/Map";
import { Point } from "geojson";
import { Dispatch, SetStateAction } from "react";

import { mapContext } from "./new-search-page";

interface mapWrapperProps {
  selectedResult: Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined,
  setSelectedResult: Dispatch<SetStateAction<Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined>>,
  map: MutableRefObject<MaplibreMap | undefined>;
  handleMapUserClick: (ev: maplibregl.MapMouseEvent & { features?: maplibregl.MapboxGeoJSONFeature[] | undefined; } & EventData) => void
}

export default function NewMapWrapper({ map, selectedResult, setSelectedResult, handleMapUserClick }: mapWrapperProps) {

  // const [selectedResult, setSelectedResult] = useState<Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined>(undefined);
  const { locationResult } = useContext(mapContext); // if behavies weirdly, then use again the initialCoords context variable
  const previousResult = usePrevious(selectedResult);

  const [areClustersLoaded, setAreClustersLoaded] = useState(false);

  const showResults = useRef(false);

  // const searchFilters = useRouteWithSearchFilters(searchRoute);

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
      addClusteredUsersToMap(newMap); // TODO: remove this (we don't need to load the full map of users)
    });
  };

  return <Map
    grow
    initialCenter={locationResult.Location}
    initialZoom={5}
    postMapInitialize={initializeMap}
    hash
  />
}
