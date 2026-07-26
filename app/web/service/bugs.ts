import { BugReportFormData } from "components/Navigation/ReportDialog";
import Sentry from "platform/sentry";
import { GeolocationClickInfoReq, GeolocationSearchInfoReq, ReportBugReq, ScreenResolution } from "proto/bugs_pb";

/*
 * The 'bugs' service actually handles some telemetry entry points.
 */
import client from "./client";

const REPLAY_FLUSH_TIMEOUT_MS = 2000;

// Force the buffered replay to upload and return its id. Best-effort: a failure
// here must never block the bug report. The timeout only caps how long the user
// waits on submit — the upload carries on in the background, so we still return
// the id rather than drop the link.
async function flushSentryReplay(): Promise<string> {
  const replay = Sentry.getReplay();
  if (!replay) return "";
  try {
    const flushed = replay.flush().catch(() => {});
    await Promise.race([flushed, new Promise((resolve) => setTimeout(resolve, REPLAY_FLUSH_TIMEOUT_MS))]);
    return replay.getReplayId() ?? "";
  } catch {
    return "";
  }
}

export async function reportBug({ description, results, subject }: BugReportFormData) {
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
  req.setSentryReplayId(await flushSentryReplay());

  const res = await client.bugs.reportBug(req);
  return res.toObject();
}

export async function geolocationSearchInfo({
  searchString,
  peliasResultJson,
  formattedResultJson,
  durationMs,
}: {
  searchString: string;
  peliasResultJson: string;
  formattedResultJson: string;
  durationMs: number;
}) {
  const req = new GeolocationSearchInfoReq();
  req.setSearchString(searchString);
  req.setPeliasResultJson(peliasResultJson);
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
