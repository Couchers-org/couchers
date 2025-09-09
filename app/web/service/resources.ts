import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export const getTermsOfService = async () => {
  const res = await client.resources.getTermsOfService(new Empty());
  return res.toObject();
};

export const getCommunityGuidelines = async () => {
  const res = await client.resources.getCommunityGuidelines(new Empty());
  return res.toObject();
};

export const getRegions = async () => {
  const regions = await client.resources.getRegions(new Empty());
  return regions.toObject();
};

export const getLanguages = async () => {
  const languages = await client.resources.getLanguages(new Empty());
  return languages.toObject();
};

export const getBadges = async () => {
  const badges = await client.resources.getBadges(new Empty());
  return badges.toObject();
};
