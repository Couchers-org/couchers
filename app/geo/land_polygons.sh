#!/bin/sh

# download split land polygons
wget https://osmdata.openstreetmap.de/download/land-polygons-split-4326.zip
unzip land-polygons-split-4326.zip

# requires postgis/postgres (not sure) on your local machine
shp2pgsql -s 4326 -D -a land-polygons-split-4326/land_polygons.shp land_polygons > land_polygons.sql
docker exec -i app_postgres_1 psql -U postgres < land_polygons.sql

# I imagine the sql could potentially be modified to do a drop table, then a recreation in one transaction?

#zstd land_polygons.sql

# financial district
#SELECT EXISTS (SELECT FROM land_polygons WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(-74.0115, 40.7077), 4326)));
# just off the coast of Manhattan
#SELECT EXISTS (SELECT FROM land_polygons WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(-74.01102, 40.70141), 4326)));
