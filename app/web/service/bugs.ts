import { BugReportFormData } from "components/Navigation/ReportDialog";
import {
  GeolocationClickInfoReq,
  GeolocationSearchInfoReq,
  ReportBugReq,
  ScreenResolution,
} from "couchers/proto/bugs_pb";

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

export async function geolocationSearchInfo({
  searchString,
  nominatimResultJson,
  formattedResultJson,
  durationMs,
}: {
  searchString: string;
  nominatimResultJson: string;
  formattedResultJson: string;
  durationMs: number;
}) {
  const req = new GeolocationSearchInfoReq();
  req.setSearchString(searchString);
  req.setNominatimResultJson(nominatimResultJson);
  req.setFormattedResultJson(formattedResultJson);
  req.setDurationMs(Math.max(Math.round(durationMs), 0));
  await client.bugs.geolocationSearchInfo(req);
}

export async function geolocationClickInfo({
  context,
  formattedResultJson,
  searchChoiceJson,
}: {
  context: string;
  formattedResultJson: string;
  searchChoiceJson: string;
}) {
  const req = new GeolocationClickInfoReq();
  req.setContext(context);
  req.setFormattedResultJson(formattedResultJson);
  req.setSearchChoiceJson(searchChoiceJson);
  await client.bugs.geolocationClickInfo(req);
}
