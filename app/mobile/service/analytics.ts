import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import { DiagnosticInfo, ReportDiagnosticsReq } from "@/proto/bugs_pb";
import { runningDebugVersionOTA } from "@/service/buildInfo";
import client from "@/service/client";

export async function logEvent(
  tag: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const info = new DiagnosticInfo();
  info.setTag(tag);
  info.setPropertiesJson(JSON.stringify(properties));
  info.setValue(1);
  info.setOccurred(Timestamp.fromDate(new Date()));
  const req = new ReportDiagnosticsReq();
  req.setFrontendVersion(runningDebugVersionOTA);
  req.setInfosList([info]);
  await client.bugs.reportDiagnostics(req);
}
