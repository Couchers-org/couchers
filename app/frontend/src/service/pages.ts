import {
  Coordinate,
  CreateGuideReq,
  CreatePlaceReq,
  GetPageReq,
} from "pb/pages_pb";
import client from "service/client";

export async function createPlace(
  title: string,
  content: string,
  address: string,
  lat: number,
  lng: number
) {
  const req = new CreatePlaceReq();
  req.setTitle(title);
  req.setContent(content);
  req.setAddress(address);
  const coordinate = new Coordinate();
  coordinate.setLat(lat);
  coordinate.setLng(lng);
  req.setLocation(coordinate);

  const response = await client.pages.createPlace(req);

  return response.toObject();
}

export async function createGuide(
  title: string,
  content: string,
  parentCommunityId: number,
  address: string,
  lat?: number,
  lng?: number
) {
  const req = new CreateGuideReq();
  req.setTitle(title);
  req.setContent(content);
  req.setAddress(address);
  if (lat && lng) {
    const coordinate = new Coordinate();
    coordinate.setLat(lat);
    coordinate.setLng(lng);
    req.setLocation(coordinate);
  }
  req.setParentCommunityId(parentCommunityId);
  const response = await client.pages.createGuide(req);

  return response.toObject();
}

export async function getPage(pageId: number) {
  const req = new GetPageReq();
  req.setPageId(pageId);
  const response = await client.pages.getPage(req);
  return response.toObject();
}
