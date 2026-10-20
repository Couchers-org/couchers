export const HANDOFF_PARAM = "ht";
const INSTALL_REFERRER_PARAM = "install_referrer";

export const HANDOFF_URL_PARAMS = [HANDOFF_PARAM, INSTALL_REFERRER_PARAM];

export function getHandoffProperties(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const installReferrer = params.get(INSTALL_REFERRER_PARAM);
  const token =
    params.get(HANDOFF_PARAM) ?? (installReferrer ? new URLSearchParams(installReferrer).get(HANDOFF_PARAM) : null);
  const properties: Record<string, string> = {};
  if (token) properties.handoff_token = token;
  if (installReferrer) properties.install_referrer = installReferrer;
  return properties;
}

export function removeHandoffParamsFromUrl(): void {
  const url = new URL(window.location.href);
  if (!HANDOFF_URL_PARAMS.some((key) => url.searchParams.has(key))) return;
  HANDOFF_URL_PARAMS.forEach((key) => url.searchParams.delete(key));
  const as = url.pathname + url.search + url.hash;
  const state = window.history.state;
  window.history.replaceState(state?.__N ? { ...state, as } : state, "", as);
}
