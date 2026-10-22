import { clusterMembers } from "./mapData";

const point = (lng: number, lat: number, count?: number) => ({
  geometry: { type: "Point", coordinates: [lng, lat] },
  properties: count === undefined ? {} : { count },
});

describe("clusterMembers", () => {
  it("counts pre-clustered features by their count and single members as one", () => {
    const { cities } = clusterMembers({
      features: [point(13.4, 52.52, 40), point(13.41, 52.5), point(13.39, 52.53, 9)],
    });

    expect(cities).toHaveLength(1);
    expect(cities[0].count).toBe(50);
    expect(cities[0].region).toBe("eu");
  });

  it("groups members into regions by continent", () => {
    const { regions } = clusterMembers({
      features: [
        point(2.35, 48.86, 10),
        point(-74.0, 40.71, 5),
        point(-46.63, -23.55, 3),
        point(151.21, -33.87, 2),
        point(139.69, 35.68, 4),
        point(36.82, -1.29, 1),
      ],
    });

    const byRegion = Object.fromEntries(regions.map((r) => [r.region, r.count]));
    expect(byRegion).toEqual({ eu: 10, na: 5, sa: 3, oc: 2, as: 4, af: 1 });
  });

  it("ignores features without a point location", () => {
    const { cities, regions } = clusterMembers({
      features: [{ geometry: null, properties: { count: 3 } }, { geometry: { type: "Polygon", coordinates: [] } }],
    });

    expect(cities).toEqual([]);
    expect(regions).toEqual([]);
  });

  it("keeps only the biggest city clusters", () => {
    // 150 members in 150 different cells, in two rows so each lands in its own cell
    const features = Array.from({ length: 150 }, (_, i) =>
      point(-178 + (i % 75) * 4.8, 0.5 + Math.floor(i / 75) * 5, i + 1),
    );

    const { cities } = clusterMembers({ features });

    expect(cities).toHaveLength(110);
    expect(cities[0].count).toBe(150);
  });
});
