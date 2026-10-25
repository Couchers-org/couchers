/**
 * Categorizes the progress on a locale's translation.
 */
import { ALWAYS_AVAILABLE_LOCALES } from "i18n/locales";
import * as translationStats from "i18n/translationStats.gen.json";

type TranslationStatsType = Record<string, { translated: number; total: number }>;

export enum TranslationReadiness {
  JustStarted,
  EarlyStage,
  Midway,
  AlmostDone,
  Complete,
}

export const SELECTABLE_THRESHOLD = TranslationReadiness.Midway;
export const PRODUCTION_READY_THRESHOLD = TranslationReadiness.AlmostDone;

/** Classifies a 0 to 1 translation progress into a readiness category. */
export function classifyTranslationReadiness(progress: number): TranslationReadiness {
  const EARLY_STAGE_PROGRESS = 0.2;
  const MIDWAY_PROGRESS = 0.5;
  const ALMOST_DONE_PROGRESS = 0.8;
  const COMPLETE_PROGRESS = 1;

  if (progress >= COMPLETE_PROGRESS) return TranslationReadiness.Complete;
  if (progress >= ALMOST_DONE_PROGRESS) return TranslationReadiness.AlmostDone;
  if (progress >= MIDWAY_PROGRESS) return TranslationReadiness.Midway;
  if (progress >= EARLY_STAGE_PROGRESS) return TranslationReadiness.EarlyStage;
  return TranslationReadiness.JustStarted;
}

/** Gets the 0 to 1 translation progress on a locale based on bundled strings (not Weblate). */
export function getLocaleBundledTranslationProgress(locale: string): number {
  if (ALWAYS_AVAILABLE_LOCALES.includes(locale)) return 1;

  const stats = (translationStats as TranslationStatsType)[locale];
  if (stats === undefined) return 0;
  return stats.translated / stats.total;
}

/** Gets the translation readiness of a locale based on bundled strings (not Weblate). */
export function getLocaleBundledTranslationReadiness(locale: string): TranslationReadiness {
  const progress = getLocaleBundledTranslationProgress(locale);
  return classifyTranslationReadiness(progress);
}
