import { Coordinate, CreatePageReq, GetPageReq } from "../pb/pages_pb";
import client from "./client";

export async function createPage(
  title: string,
  content: string,
  address: string,
  lat: number,
  lng: number
) {
  const req = new CreatePageReq();
  req.setTitle(title);
  req.setContent(content);
  req.setAddress(address);
  const coordinate = new Coordinate();
  coordinate.setLat(lat);
  coordinate.setLng(lng);
  req.setLocation(coordinate);

  const response = await client.pages.createPage(req);

  return response.toObject();
}

export async function getPage(pageId: number) {
  const req = new GetPageReq();
  req.setPageId(pageId);
  const response = await client.pages.getPage(req);
  return response.toObject();
}
