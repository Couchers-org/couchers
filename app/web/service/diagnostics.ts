import { DiagnosticInfo, ReportDiagnosticsReq } from "couchers/proto/bugs_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import client from "./client";

export interface DiagnosticEvent {
  tag: string;
  propertiesJson: string;
  value: number;
  occurred: Date;
}

export async function reportDiagnostics(
  events: DiagnosticEvent[],
  frontendVersion: string,
) {
  const req = new ReportDiagnosticsReq();
  req.setFrontendVersion(frontendVersion);

  for (const event of events) {
    const info = new DiagnosticInfo();
    info.setTag(event.tag);
    info.setPropertiesJson(event.propertiesJson);
    info.setValue(event.value);

    const ts = new Timestamp();
    ts.fromDate(event.occurred);
    info.setOccurred(ts);

    req.addInfos(info);
  }

  await client.bugs.reportDiagnostics(req);
}
