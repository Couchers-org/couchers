import { View, Dimensions, TouchableOpacity } from "react-native";
import MapLibreGL, { MapViewRef } from "@maplibre/maplibre-react-native";
import { StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";

import LocationAutocomplete from "@/components/LocationAutocomplete";
import { useForm } from "react-hook-form";
import { theme } from "@/theme";
import UserCard from "@/features/search/search_results/UserCard";

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  map: {
    height: Dimensions.get("window").height,
  },
  searchContainer: {
    width: "85%",
    position: "absolute",
    top: 70,
    zIndex: 1,
    left: "7.5%",
  },
  zoomText: {
    position: "absolute",
    top: 50,
    left: "7.5%",
  },
  userCard: {
    position: 'absolute',
    bottom: 20,
    left: '7.5%',
    width: '85%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

MapLibreGL.setAccessToken(null);

function GetZoom() {
  const mapRef = React.useRef<MapViewRef>(null);
  const cameraRef = React.useRef(null);
  const { control, setValue, register, handleSubmit } = useForm({
    mode: "onChange",
  });
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        "https://dev-api.couchershq.org/geojson/users",
        {
          credentials: "include", // This ensures cookies are sent
        }
      );
      return response.json();
    };
    fetchData().then((data) => {
      setGeojsonData(data);
    });
  }, []);

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        logoEnabled={false}
        styleURL="https://maps.couchershq.org/static/couchers-basemap-style-v1.json"
        attributionPosition={{ bottom: 8, right: 8 }}
        onPress={() => setSelectedUserId(null)}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [19.970895, 53.723279],
            zoomLevel: 5,
          }}
        />

        <MapLibreGL.ShapeSource
          id="clustered-users"
          cluster={true}
          clusterMaxZoomLevel={14}
          clusterRadius={50}
          shape={geojsonData}
          onPress={async (event) => {
            const feature = event.features[0];
            if (feature.properties?.point_count) {
              // Handle cluster click by zooming in
              if (feature.geometry.type === 'Point') {
                const coordinates = feature.geometry.coordinates;
                const currentZoom = await mapRef.current?.getZoom() || 5;
                // @ts-ignore (cameraRef.current type needs to be properly defined)
                cameraRef.current?.setCamera({
                  centerCoordinate: coordinates,
                  zoomLevel: currentZoom + 1,
                  animationDuration: 1000,
                });
              }
            } else {
              setSelectedUserId(feature.properties?.id);
            }
          }}
        >
          <MapLibreGL.CircleLayer
            id="clusters"
            filter={["has", "point_count"]}
            style={{
              circleColor: [
                "step",
                ["get", "point_count"],
                theme.palette.primary.light,
                100,
                theme.palette.primary.main,
                750,
                theme.palette.primary.dark,
              ],
              circleRadius: ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
            }}
          />

          <MapLibreGL.SymbolLayer
            id="clusters-count"
            filter={["has", "point_count"]}
            style={{
              textField: "{point_count_abbreviated}",
              textSize: 12,
              textFont: ["Inter 28pt SemiBold"],
              textColor: [
                "step",
                ["get", "point_count"],
                theme.palette.text.primary,
                100,
                theme.palette.text.primary,
                750,
                theme.palette.text.primary,
              ],
            }}
          />

          <MapLibreGL.CircleLayer
            id="unclustered-points"
            style={{
              circleRadius: 10,
              circleColor: [
                'case',
                ['==', ['get', 'id'], selectedUserId ?? ''],
                theme.palette.secondary.main, // Orange color when selected
                theme.palette.grey[500], // Default gray color
              ],
              circleOpacity: 0.7,
              circleStrokeWidth: 2,
              circleStrokeColor: "#fff"
            }}
            filter={["!", ["has", "point_count"]]}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
      <View style={styles.searchContainer}>
        <LocationAutocomplete
          control={control}
          name="location"
          defaultValue={""}
          fieldError={"Error is here"}
          onSelectLocation={(value) => {
            // @ts-ignore (cameraRef.current type needs to be properly defined)
            cameraRef.current?.setCamera({
              centerCoordinate: value.location,
              zoomLevel: 9,
              animationDuration: 2000,
            });
          }}
        />
      </View>

      <UserCard selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} />
    </View>
  );
}

export default GetZoom;
