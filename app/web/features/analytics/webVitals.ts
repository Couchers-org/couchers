import { MetricWithAttribution, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";

const MAX_TARGET_LENGTH = 150;

function round(value: number | undefined): number | null {
  return value === undefined ? null : Math.round(value);
}

function shortenUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("data:")) return "data:";
  return url.split(/[?#]/)[0].slice(0, 200);
}

// The default selector spends its length on emotion's generated class names and on every MUI modifier class, which
// leaves no room for the ancestors that tell us where on the page the element is
function getTarget(node: Node | null): string | undefined {
  let target = "";
  let el = node instanceof Element ? node : node?.parentElement;
  while (el && el !== document.body) {
    const classes = Array.from(el.classList).filter(
      (name) => !name.startsWith("css-") && (!name.startsWith("Mui") || name.endsWith("-root")),
    );
    const part = [el.nodeName.toLowerCase() + (el.id ? `#${el.id}` : ""), ...classes].join(".");
    if (target.length + part.length + 1 > MAX_TARGET_LENGTH) break;
    target = target ? `${part}>${target}` : part;
    el = el.parentElement;
  }
  return target || undefined;
}

function attributionProperties(metric: MetricWithAttribution): Record<string, unknown> {
  switch (metric.name) {
    case "CLS": {
      const { attribution } = metric;
      return {
        target: attribution.largestShiftTarget ?? null,
        largest_shift: attribution.largestShiftValue ?? null,
        largest_shift_time: round(attribution.largestShiftTime),
        load_state: attribution.loadState ?? null,
      };
    }
    case "LCP": {
      const { attribution } = metric;
      return {
        target: attribution.target ?? null,
        url: shortenUrl(attribution.url),
        time_to_first_byte: round(attribution.timeToFirstByte),
        resource_load_delay: round(attribution.resourceLoadDelay),
        resource_load_duration: round(attribution.resourceLoadDuration),
        element_render_delay: round(attribution.elementRenderDelay),
      };
    }
    case "INP": {
      const { attribution } = metric;
      const script = attribution.longestScript;
      return {
        target: attribution.interactionTarget ?? null,
        interaction_type: attribution.interactionType ?? null,
        input_delay: round(attribution.inputDelay),
        processing_duration: round(attribution.processingDuration),
        presentation_delay: round(attribution.presentationDelay),
        load_state: attribution.loadState,
        longest_script_invoker: script?.entry.invoker ?? null,
        longest_script_source: script
          ? `${shortenUrl(script.entry.sourceURL) ?? ""}:${script.entry.sourceFunctionName}`
          : null,
        longest_script_subpart: script?.subpart ?? null,
        longest_script_duration: round(script?.intersectingDuration),
      };
    }
    case "FCP": {
      const { attribution } = metric;
      return {
        time_to_first_byte: round(attribution.timeToFirstByte),
        first_byte_to_fcp: round(attribution.firstByteToFCP),
        load_state: attribution.loadState,
      };
    }
    case "TTFB": {
      const { attribution } = metric;
      return {
        waiting_duration: round(attribution.waitingDuration),
        cache_duration: round(attribution.cacheDuration),
        dns_duration: round(attribution.dnsDuration),
        connection_duration: round(attribution.connectionDuration),
        request_duration: round(attribution.requestDuration),
      };
    }
  }
}

export function reportWebVitals(
  report: (metric: MetricWithAttribution, attribution: Record<string, unknown>) => void,
): void {
  const callback = (metric: MetricWithAttribution) => report(metric, attributionProperties(metric));
  const opts = { reportSoftNavs: true, generateTarget: getTarget };
  onCLS(callback, opts);
  onLCP(callback, opts);
  onINP(callback, opts);
  onFCP(callback, opts);
  onTTFB(callback);
}
