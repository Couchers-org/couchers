import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import client from "service/client";

export async function getTermsOfService() {
  const res = await client.resources.getTermsOfService(new Empty());

  return res.toObject();
}

export async function getRegions() {
  return client.resources.getRegions(new Empty()).then(
    (res) => res.toObject(),
    (error) => {
      console.error("Failed to get regions.");
      throw error;
    }
  );
}

export async function getLanguages() {
  return client.resources.getLanguages(new Empty()).then(
    (res) => res.toObject(),
    (error) => {
      console.error("Failed to get languages.");
      throw error;
    }
  );
}
