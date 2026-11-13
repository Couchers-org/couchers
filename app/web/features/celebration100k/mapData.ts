export type Region = "na" | "sa" | "eu" | "af" | "as" | "oc";

export interface MemberCluster {
  lat: number;
  lng: number;
  count: number;
  region: Region;
}

export interface Stay {
  from: [number, number];
  to: [number, number];
  hello: string;
}

interface MemberFeature {
  geometry?: { type?: string; coordinates?: number[] } | null;
  properties?: { count?: number } | null;
}

export interface MemberGeoJson {
  features?: MemberFeature[];
}

// Size of the grid cells members are grouped into for the city-level clusters
const CELL_DEGREES = 4;
const MAX_CITY_CLUSTERS = 110;

// Example stays drawn as travel lines. Each greeting is deliberately in the destination's language.
export const STAYS: Stay[] = [
  { from: [38.72, -9.14], to: [52.52, 13.4], hello: "Willkommen!" },
  { from: [40.71, -74.0], to: [19.43, -99.13], hello: "¡Bienvenidos!" },
  { from: [-23.55, -46.63], to: [38.72, -9.14], hello: "Bem-vindo!" },
  { from: [48.86, 2.35], to: [-1.29, 36.82], hello: "Karibu!" },
  { from: [37.57, 126.98], to: [35.68, 139.69], hello: "ようこそ" },
  { from: [51.5, -0.13], to: [13.76, 100.5], hello: "Sawasdee!" },
  { from: [-33.87, 151.21], to: [-36.85, 174.76], hello: "Kia ora!" },
  { from: [43.65, -79.38], to: [41.39, 2.17], hello: "¡Bienvenido!" },
  { from: [52.23, 21.01], to: [41.01, 28.98], hello: "Hoş geldin!" },
  { from: [-34.6, -58.38], to: [-33.45, -70.67], hello: "¡Bienvenida!" },
  { from: [28.61, 77.21], to: [27.72, 85.32], hello: "Namaste!" },
];

function regionOf(lat: number, lng: number): Region {
  if (lng < -30) return lat > 12 ? "na" : "sa";
  if (lat < -10 && lng > 110) return "oc";
  if (lng >= 52 || (lng >= 40 && lat > 20 && lat < 30)) return "as";
  return lat >= 35 ? "eu" : "af";
}

interface Accumulator {
  latSum: number;
  lngSum: number;
  count: number;
}

function add<K>(groups: Map<K, Accumulator>, key: K, lat: number, lng: number, weight: number) {
  const group = groups.get(key) ?? { latSum: 0, lngSum: 0, count: 0 };
  group.latSum += lat * weight;
  group.lngSum += lng * weight;
  group.count += weight;
  groups.set(key, group);
}

function toClusters(groups: Map<string, Accumulator>): MemberCluster[] {
  return [...groups.values()].map(({ latSum, lngSum, count }) => {
    const lat = latSum / count;
    const lng = lngSum / count;
    return { lat, lng, count, region: regionOf(lat, lng) };
  });
}

/**
 * Groups member locations into city-sized clusters (the biggest ones only) and continent-sized regions.
 * Features may already be clusters with a `count` property, like /geojson/clustered-users.
 */
export function clusterMembers(geojson: MemberGeoJson): { cities: MemberCluster[]; regions: MemberCluster[] } {
  const cells = new Map<string, Accumulator>();
  const regions = new Map<Region, Accumulator>();

  for (const feature of geojson.features ?? []) {
    const coordinates = feature.geometry?.type === "Point" ? feature.geometry.coordinates : undefined;
    if (!coordinates || coordinates.length < 2) continue;
    const [lng, lat] = coordinates;
    const weight = typeof feature.properties?.count === "number" ? feature.properties.count : 1;
    add(cells, `${Math.floor(lat / CELL_DEGREES)}:${Math.floor(lng / CELL_DEGREES)}`, lat, lng, weight);
    add(regions, regionOf(lat, lng), lat, lng, weight);
  }

  const cities = toClusters(cells)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_CITY_CLUSTERS);

  // A region's centroid can fall outside its own bounds, so keep the region it was grouped under
  const regionClusters = [...regions.entries()].map(([region, { latSum, lngSum, count }]) => ({
    lat: latSum / count,
    lng: lngSum / count,
    count,
    region,
  }));

  return { cities, regions: regionClusters };
}

export async function fetchMemberLocations(url: string): Promise<MemberGeoJson> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Couldn't load member locations (${response.status})`);
  }
  return response.json();
}
