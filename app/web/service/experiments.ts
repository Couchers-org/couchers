import { LogExperimentExposureReq } from "couchers/proto/bugs_pb";

import client from "./client";

export type ExposureReport = {
  experimentKey: string;
  experimentName: string;
  variationId: number;
  variationKey: string;
  variationName: string;
  hashAttribute: string;
  hashValue: string;
  featureId: string;
  inExperiment: boolean;
  bucket?: number;
  hashUsed?: boolean;
  stickyBucketUsed?: boolean;
};

export async function reportExposure(exposure: ExposureReport): Promise<void> {
  const req = new LogExperimentExposureReq();
  req.setExperimentKey(exposure.experimentKey);
  req.setExperimentName(exposure.experimentName);
  req.setVariationId(exposure.variationId);
  req.setVariationKey(exposure.variationKey);
  req.setVariationName(exposure.variationName);
  req.setHashAttribute(exposure.hashAttribute);
  req.setHashValue(exposure.hashValue);
  req.setFeatureId(exposure.featureId);
  req.setInExperiment(exposure.inExperiment);
  if (exposure.bucket !== undefined) {
    req.setBucket(exposure.bucket);
  }
  if (exposure.hashUsed !== undefined) {
    req.setHashUsed(exposure.hashUsed);
  }
  if (exposure.stickyBucketUsed !== undefined) {
    req.setStickyBucketUsed(exposure.stickyBucketUsed);
  }
  await client.bugs.logExperimentExposure(req);
}
