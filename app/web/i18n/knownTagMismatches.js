/**
 * Translations that already carry different markup to their English source, as
 * "namespace/locale:key". Each one renders wrong today: a dropped link, a
 * translated tag name, an unclosed tag.
 *
 * Nothing may be added here. These are fixed in Weblate, not in the repo, and
 * an entry comes off as its translation is corrected.
 *
 * Consumed by `i18n/locales.test.ts`.
 */
const knownTagMismatches = [
  "auth/ca:strong_verification.instructions.step7",
  "auth/fr:strong_verification.instructions.step7",
  "auth/ja:change_email_form.current_email_message",
  "auth/pt-BR:strong_verification.instructions.step7",
  "auth/pt-BR:volunteer_management.not_a_volunteer_message",
  "auth/ru:strong_verification.status.disabled_message",
  "auth/ru:strong_verification.status.enabled_message",
  "auth/zh-Hans:change_email_form.current_email_message",
  "auth/zh-Hans:strong_verification.instructions.step7",
  "auth/zh-Hant:strong_verification.instructions.step7",
  "communities/pt:events_empty_state",
  "dashboard/fr:landing_text",
  "donations/hi:donations_box.helper_text",
  "donations/ja:donations_box.helper_text",
  "donations/nb-NO:donations_box.helper_text",
  "donations/pt:donations_box.helper_text",
  "donations/ru:donations_box.helper_text",
  "global/fr:cookie_message",
  "global/zh-Hans:what_is_cs.is_it_safe.description_2",
  "global/zh-Hant:what_is_cs.is_it_safe.description_2",
  "landing/pt-BR:signup_description2_one",
  "landing/pt-BR:signup_description2_other",
  "messages/zh-Hans:host_pending_request_help_text",
  "messages/zh-Hans:surfer_declined_request_help_text",
  "messages/zh-Hant:host_pending_request_help_text",
  "messages/zh-Hant:surfer_declined_request_help_text",
  "profile/tr:complete_profile_dialog.description_1",
];

module.exports = knownTagMismatches;
