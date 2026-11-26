import Router from "next/router";

type ResourceKind = "api" | "script" | "style" | "font" | "image" | "other";

type ResourceTotals = {
  count: number;
  transfer_bytes: number;
  body_bytes: number;
  cached: number;
  unsized: number;
};

// The page counts as loaded once no new request has started for this long after the previous one finished
const QUIET_GAP_MS = 2_000;
const REPORT_AFTER_MS = 10_000;

function resourceKind(entry: PerformanceResourceTiming): ResourceKind {
  const path = new URL(entry.name, window.location.href).pathname;
  if (path.includes("/org.couchers.")) return "api";
  if (path.endsWith(".js")) return "script";
  if (path.endsWith(".css")) return "style";
  if (/\.(woff2?|ttf|otf)$/.test(path)) return "font";
  if (entry.initiatorType === "img" || /\.(png|jpe?g|gif|webp|avif|svg|ico)$/.test(path)) return "image";
  return "other";
}

function summarize(
  nav: PerformanceNavigationTiming,
  resources: PerformanceResourceTiming[],
  cutoff: number,
  interruptedBy: "navigation" | "hidden" | null,
  hiddenAtStart: boolean,
) {
  let settled = Math.max(nav.responseEnd, nav.loadEventEnd);
  const included = [];
  for (const entry of [...resources].sort((a, b) => a.startTime - b.startTime)) {
    if (entry.startTime > cutoff || entry.startTime > settled + QUIET_GAP_MS) break;
    settled = Math.max(settled, entry.responseEnd);
    included.push(entry);
  }

  const totals: Partial<Record<ResourceKind, ResourceTotals>> = {};
  let totalTransferBytes = nav.transferSize;
  for (const entry of included) {
    const kind = resourceKind(entry);
    const kindTotals = (totals[kind] ??= { count: 0, transfer_bytes: 0, body_bytes: 0, cached: 0, unsized: 0 });
    kindTotals.count += 1;
    kindTotals.transfer_bytes += entry.transferSize;
    kindTotals.body_bytes += entry.decodedBodySize;
    // other origins report zero sizes unless they send Timing-Allow-Origin
    if (entry.decodedBodySize === 0) kindTotals.unsized += 1;
    else if (entry.transferSize === 0) kindTotals.cached += 1;
    totalTransferBytes += entry.transferSize;
  }

  return {
    settled: Math.round(settled),
    properties: {
      navigation_type: nav.type,
      redirect_count: nav.redirectCount,
      redirect_ms: Math.round(nav.redirectEnd - nav.redirectStart),
      dns_ms: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      connect_ms: Math.round(nav.connectEnd - nav.connectStart),
      ttfb_ms: Math.round(nav.responseStart),
      response_end_ms: Math.round(nav.responseEnd),
      dom_interactive_ms: Math.round(nav.domInteractive),
      dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd) || null,
      load_ms: Math.round(nav.loadEventEnd) || null,
      settled_ms: Math.round(settled),
      quiet: settled + QUIET_GAP_MS <= cutoff,
      interrupted_by: interruptedBy,
      hidden_at_start: hiddenAtStart,
      document: { transfer_bytes: nav.transferSize, body_bytes: nav.decodedBodySize },
      resources: totals,
      total_transfer_bytes: totalTransferBytes,
    },
  };
}

/**
 * Reports what the first page load of this document fetched, and when it finished, once it has had time to settle,
 * when the user navigates to another page, or when the page is hidden.
 */
export function trackPageLoad(report: (properties: Record<string, unknown>, settledMs: number) => void): () => void {
  if (
    typeof PerformanceObserver === "undefined" ||
    !PerformanceObserver.supportedEntryTypes?.includes("navigation") ||
    !PerformanceObserver.supportedEntryTypes.includes("resource")
  ) {
    return () => {};
  }

  const hiddenAtStart = document.visibilityState === "hidden";
  const resources: PerformanceResourceTiming[] = [];
  const observer = new PerformanceObserver((list) => {
    resources.push(...(list.getEntries() as PerformanceResourceTiming[]));
  });
  observer.observe({ type: "resource", buffered: true });

  const stop = () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    Router.events.off("routeChangeStart", onRouteChangeStart);
    observer.disconnect();
  };

  const finish = (interruptedBy: "navigation" | "hidden" | null) => {
    resources.push(...(observer.takeRecords() as PerformanceResourceTiming[]));
    stop();
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    const { properties, settled } = summarize(nav, resources, performance.now(), interruptedBy, hiddenAtStart);
    report(properties, settled);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") finish("hidden");
  };
  const onRouteChangeStart = (url: string) => {
    // a change to the query alone, such as removing tracking params, is still the same page
    if (url.split(/[?#]/)[0] !== window.location.pathname) finish("navigation");
  };

  const timer = setTimeout(() => finish(null), Math.max(0, REPORT_AFTER_MS - performance.now()));
  document.addEventListener("visibilitychange", onVisibilityChange);
  Router.events.on("routeChangeStart", onRouteChangeStart);

  return stop;
}
