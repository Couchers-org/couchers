createdb countries
psql countries -c "CREATE EXTENSION postgis;"

mkdir -p ne_50m_admin_0_countries
pushd ne_50m_admin_0_countries
wget https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip
unzip ne_50m_admin_0_countries.zip
popd

shp2pgsql -d ne_50m_admin_0_countries/ne_50m_admin_0_countries.shp countries_ne50 > countries.sql
psql countries < countries.sql

jq -r ".[] | [.alpha2, .alpha3] | @csv" ../backend/src/data/regions.json > alpha2to3.csv

psql countries << EOF
CREATE TABLE alpha2to3 (
  alpha2 VARCHAR(2) NOT NULL UNIQUE,
  alpha3 VARCHAR(3) NOT NULL UNIQUE
)
EOF

psql countries -c "COPY alpha2to3(alpha2, alpha3) FROM stdin CSV" < alpha2to3.csv
psql countries -c "CREATE TABLE countries_thumbnail AS SELECT alpha2to3.alpha3, countries_ne50.geom FROM countries_ne50 JOIN alpha2to3 ON (alpha2to3.alpha2 = countries_ne50.iso_a2 OR alpha2to3.alpha3 = countries_ne50.adm0_a3)"

psql -t countries > regions.geojson << EOF
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(ST_AsGeoJSON(t.*, 'geom', 4)::json)
    )
FROM (SELECT alpha3 AS region, geom FROM countries_thumbnail WHERE geom IS NOT NULL AND alpha3 IS NOT NULL) AS t;
EOF

cp regions.geojson ../frontend/public/regions.geojson
