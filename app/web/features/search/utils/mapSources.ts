import { SourceSpecification } from "maplibre-gl";

type SourceKeys = "clustered-users";

const sources: Record<SourceKeys, SourceSpecification> = {
  "clustered-users": {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    data: URL + "/geojson/users",
    promoteId: "id",
    type: "geojson",
  },
};

export { sources };
