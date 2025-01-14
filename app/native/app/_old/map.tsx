import MapLibreGL from "@maplibre/maplibre-react-native";
import { StyleSheet } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function Signup() {
  MapLibreGL.setAccessToken(null);

  return (
    <SafeAreaView style={styles.sav}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://maps.couchershq.org/static/couchers-basemap-style-v1.json"
        logoEnabled={false}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          defaultSettings={{ centerCoordinate: [2, 41.5], zoomLevel: 8 }}
        />
      </MapLibreGL.MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sav: {
    height: "100%",
    backgroundColor: "#ffffff",
  },
  map: {
    margin: 0,
    padding: 0,
    height: "100%",
  },
});
