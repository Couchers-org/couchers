import { ReportBugReq } from "proto/bugs_pb";
import client from "service/client";

export interface BugReportFormData {
  subject: string;
  description: string;
  results: string;
}

export async function reportBug({
  description,
  results,
  subject,
}: BugReportFormData) {
  const req = new ReportBugReq();

  req.setSubject(subject);
  req.setDescription(description);
  req.setResults(results);
  req.setFrontendVersion(process.env.REACT_APP_VERSION!);
  req.setUserAgent(navigator.userAgent);
  req.setPage(window.location.href);

  const res = await client.bugs.reportBug(req);
  return res.toObject();
}
