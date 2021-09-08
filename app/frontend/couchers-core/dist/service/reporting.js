import { ReportReq } from "proto/reporting_pb";
import client from "service/client";
export function reportContent(_a) {
    var reason = _a.reason, description = _a.description, contentRef = _a.contentRef, authorUser = _a.authorUser;
    var req = new ReportReq();
    req.setReason(reason);
    req.setDescription(description);
    req.setContentRef(contentRef);
    // authorUser can be string or the string representation of a number
    req.setAuthorUser(authorUser.toString());
    req.setUserAgent(navigator.userAgent);
    req.setPage(window.location.href);
    return client.reporting.report(req);
}
//# sourceMappingURL=reporting.js.map