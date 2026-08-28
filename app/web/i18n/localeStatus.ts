import { useMemo } from "react";

import { ALWAYS_AVAILABLE_LOCALES } from "./locales";
import { useWeblateLanguages, WeblateLanguage, weblateToISOLocale } from "./weblate";

// Mirrors the cutoffs in features/translate/constants.ts. That file's
// consumers will be migrated to read `readiness` instead and it will be
// removed as later steps of #9625 land; kept duplicated here in the
// meantime to avoid a features/ -> i18n/ dependency.
const EARLY_STAGE_PERCENTAGE = 20;
const MIDWAY_PERCENTAGE = 50;
const ALMOST_DONE_PERCENTAGE = 80;
const COMPLETE_PERCENTAGE = 100;

export enum LocaleReadiness {
  JustStarted,
  EarlyStage,
  Midway,
  AlmostDone,
  Complete,
}

export interface LocaleStatus {
  percent: number;
  readiness: LocaleReadiness;
}

function getReadiness(percent: number): LocaleReadiness {
  if (percent >= COMPLETE_PERCENTAGE) return LocaleReadiness.Complete;
  if (percent >= ALMOST_DONE_PERCENTAGE) return LocaleReadiness.AlmostDone;
  if (percent >= MIDWAY_PERCENTAGE) return LocaleReadiness.Midway;
  if (percent >= EARLY_STAGE_PERCENTAGE) return LocaleReadiness.EarlyStage;
  return LocaleReadiness.JustStarted;
}

/**
 * Gets the full list of supported locales and their availability status
 * based on Weblate-sourced language stats, keyed by ISO locale code.
 */
export function getLocaleStatuses(weblateLanguages: WeblateLanguage[]): Record<string, LocaleStatus> {
  const statuses: Record<string, LocaleStatus> = {};

  for (const language of weblateLanguages) {
    const code = weblateToISOLocale(language.code);
    statuses[code] = {
      percent: language.translated_percent,
      readiness: getReadiness(language.translated_percent),
    };
  }

  for (const code of ALWAYS_AVAILABLE_LOCALES) {
    statuses[code] = { percent: COMPLETE_PERCENTAGE, readiness: LocaleReadiness.Complete };
  }

  return statuses;
}

export function isProductionReady(status: LocaleStatus | undefined): boolean {
  return status !== undefined && status.readiness >= LocaleReadiness.AlmostDone;
}

export function isSelectable(status: LocaleStatus | undefined): boolean {
  return status !== undefined && status.readiness >= LocaleReadiness.Midway;
}

export function useLocaleStatuses() {
  const { data: weblateLanguages, ...rest } = useWeblateLanguages();
  const data = useMemo(() => getLocaleStatuses(weblateLanguages ?? []), [weblateLanguages]);
  return { data, ...rest };
}
