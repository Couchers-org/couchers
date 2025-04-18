import { SourceSpecification } from "maplibre-gl";

import { SOURCE_CLUSTERED_USERS_ID } from "./mapLayers";

type SourceKeys = "clustered-users";

const sources: Record<SourceKeys, SourceSpecification> = {
  [SOURCE_CLUSTERED_USERS_ID]: {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    data: URL + "/geojson/users",
    promoteId: "id",
    type: "geojson",
  },
};

export { sources };
