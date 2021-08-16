import { ReportReq } from "proto/reporting_pb";
import client from "service/client";

export interface ReportInput {
  reason: string;
  description: string;
  contentRef: string;
  authorUser: string;
}

export function reportContent({
  reason,
  description,
  contentRef,
  authorUser,
}: ReportInput) {
  const req = new ReportReq();
  req.setReason(reason);
  req.setDescription(description);
  req.setContentRef(contentRef);
  req.setAuthorUser(authorUser);

  req.setUserAgent(navigator.userAgent);
  req.setPage(window.location.href);

  return client.reporting.report(req);
}
