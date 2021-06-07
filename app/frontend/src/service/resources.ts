import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import client from "service/client";

export async function getTermsOfService() {
  const res = await client.resources.getTermsOfService(new Empty());

  return res.toObject();
}

export async function getRegions() {
  const regions = await client.resources.getRegions(new Empty());
  return regions.getRegionsMap();
}

export async function getLanguages() {
  const languages = await client.resources.getLanguages(new Empty());
  return languages.getLanguagesMap();
}
