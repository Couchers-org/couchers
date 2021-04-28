import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { Area, UserSearchReq } from "pb/search_pb";
import client from "service/client";

interface UserSearchFilters {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export async function userSearch(
  { query, lat, lng, radius }: UserSearchFilters,
  pageToken: string = ""
) {
  const req = new UserSearchReq();
  req.setPageToken(pageToken);

  if (lat !== undefined && lng !== undefined) {
    const area = new Area().setLat(lat).setLng(lng);
    if (radius) area.setRadius(radius);
    else throw Error("Tried to search an area without a radius");
    req.setSearchInArea(area);
  } else if (query !== undefined) {
    req.setQuery(new StringValue().setValue(query));
  } else {
    throw Error("Please enter a search query");
  }
  console.log(req.toObject());

  const response = await client.search.userSearch(req);
  console.log(response.toObject());

  return response.toObject();
}
