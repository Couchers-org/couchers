import { Experiment, Result } from "@growthbook/growthbook";
import Sentry from "platform/sentry";
import { reportExposure } from "service/experiments";

export function recordExposure(
  experiment: Experiment<unknown>,
  result: Result<unknown>,
) {
  return reportExposure({
    experimentKey: experiment.key,
    experimentName: experiment.name ?? "",
    variationId: result.variationId,
    variationKey: result.key,
    variationName: result.name ?? "",
    hashAttribute: result.hashAttribute,
    hashValue: result.hashValue,
    featureId: result.featureId ?? "",
    inExperiment: result.inExperiment,
    bucket: result.bucket,
    hashUsed: result.hashUsed,
    stickyBucketUsed: result.stickyBucketUsed,
  }).catch((e) => {
    Sentry.captureException(e);
  });
}
