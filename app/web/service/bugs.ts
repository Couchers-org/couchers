import { BugReportFormData } from "@/components/Navigation/ReportDialog";
import { ReportBugReq, ScreenResolution } from "@/proto/bugs_pb";

import client from "./client";

export async function reportBug({
  description,
  results,
  subject,
}: BugReportFormData) {
  const req = new ReportBugReq();

  const screenResolution = new ScreenResolution();
  screenResolution.setWidth(window.innerWidth);
  screenResolution.setHeight(window.innerHeight);

  req.setSubject(subject);
  req.setDescription(description);
  req.setResults(results);
  req.setFrontendVersion(process.env.NEXT_PUBLIC_VERSION);
  req.setUserAgent(navigator.userAgent);
  req.setScreenResolution(screenResolution);
  req.setPage(window.location.href);

  const res = await client.bugs.reportBug(req);
  return res.toObject();
}
