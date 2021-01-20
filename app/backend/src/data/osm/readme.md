# How to export OSM polygons to GeoJSON

1. Go to https://nominatim.openstreetmap.org/ui/search.html and search for the area you're looking for
2. Take note of the relation id, e.g. 175905
3. Go to https://overpass-turbo.eu/ and type the following query (replace 175905 with the relation id):

```
rel(175905);
out geom;
```

4. Click Export > GeoJSON and save it as 175905.geojson in here
