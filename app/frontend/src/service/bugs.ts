import { BugReportFormData } from "features/BugReport";
import { ReportBugReq } from "pb/bugs_pb";
import client from "service/client";

export async function reportBug(
  { description, results, steps, subject }: BugReportFormData,
  userId: number | null
) {
  const req = new ReportBugReq();

  req.setSubject(subject);
  req.setDescription(description);
  req.setSteps(steps);
  req.setResults(results);
  req.setFrontendVersion(process.env.REACT_APP_VERSION);
  req.setUserAgent(navigator.userAgent);
  req.setPage(window.location.href);
  req.setUserId(Number(userId));

  const res = await client.bugs.reportBug(req);
  return res.getReportIdentifier();
}
