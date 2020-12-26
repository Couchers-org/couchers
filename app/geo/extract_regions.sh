#!/bin/sh

api_url="https://overpass-api.de/api/interpreter"
# api_url="https://overpass.kumi.systems/api/interpreter"

# build the query
q="("
for ccode in $(cat ../backend/src/data/regions.json | jq -r ".[].alpha2"); do
  q="$q rel['ISO3166-1:alpha2'='$ccode'];"
  # this one gets info about the label and admin_centre location
  # q="$q rel['ISO3166-1:alpha2'='$ccode'];node(r:'label'); rel['ISO3166-1:alpha2'='$ccode'];node(r:'admin_centre');"
done
q="$q); (._;>;); out;"

curl --data-urlencode "data=$q" $api_url > all_geom.osm

# you need a database called "countries" on localhost for this to work
osm2pgsql -E 4326 -d countries -p countries --style default.style all_geom.osm

psql countries << EOF
DROP TABLE countries_point;
DROP TABLE countries_line;
DROP TABLE countries_roads;

ALTER TABLE countries_polygon RENAME COLUMN "name:en" TO name;
ALTER TABLE countries_polygon RENAME COLUMN "ISO3166-1:alpha2" TO alpha2;
ALTER TABLE countries_polygon RENAME COLUMN "ISO3166-1:alpha3" TO alpha3;
ALTER TABLE countries_polygon RENAME COLUMN way_area TO area;
ALTER TABLE countries_polygon RENAME COLUMN way TO geom;

DELETE FROM countries_polygon WHERE alpha3 IS NULL;
EOF

psql countries -c "COPY countries_polygon (alpha3, admin_level, area, geom) TO stdout" > region_polygons.data
docker exec -i app_postgres_1 psql -U postgres -c "BEGIN; TRUNCATE TABLE region_polygons; COPY region_polygons(alpha3, admin_level, area, geom) FROM stdin; COMMIT;" < region_polygons.data
