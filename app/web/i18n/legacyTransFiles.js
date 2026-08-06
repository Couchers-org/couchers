/**
 * Files whose `<Trans>` call sites predate /docs/translation-components.md:
 * they pass their markup as children, number their `components` entries, or
 * pass `components` as an array.
 *
 * Nothing may be added here. Entries come off as call sites are migrated to
 * named tags, and the file goes away with the last one. Being listed only
 * waives the style rules — a call site that disagrees with the string it
 * renders is an error here as much as anywhere else.
 *
 * Consumed by the `couchers/trans-components` ESLint rule.
 */
const legacyTransFiles = [
  "components/CookieBanner.tsx",
  "components/Footer/Footer.tsx",
  "components/ProfileIncompleteDialog/ProfileIncompleteDialog.tsx",
  "features/NotFoundPage.tsx",
  "features/auth/deletion/DeleteAccount.tsx",
  "features/auth/email/ChangeEmail.tsx",
  "features/auth/email/DoNotEmail.tsx",
  "features/auth/jail/ModNoteCard.tsx",
  "features/auth/jail/TOSSection.tsx",
  "features/auth/login/Login.tsx",
  "features/auth/logins/LoginCard.tsx",
  "features/auth/phone/ChangePhone.tsx",
  "features/auth/signup/AccountForm.tsx",
  "features/auth/signup/ResendVerificationEmailForm.tsx",
  "features/auth/signup/Signup.tsx",
  "features/auth/signup/SignupFormContent.tsx",
  "features/auth/timezone/Timezone.tsx",
  "features/auth/username/Username.tsx",
  "features/auth/verification/StrongVerification.tsx",
  "features/auth/verification/StrongVerificationPage.tsx",
  "features/auth/visibility/ProfileVisibility.tsx",
  "features/auth/volunteer/VolunteerManagement.tsx",
  "features/communities/CommunitiesPage/CommunitiesPage.tsx",
  "features/communities/CommunitiesPage/CommunitySearch.tsx",
  "features/communities/CommunityPage/SubCommunitiesDropdown.tsx",
  "features/communities/events/CommunityEventsList.tsx",
  "features/communities/events/DiscoverEventsList.tsx",
  "features/communities/events/EventsSection.tsx",
  "features/communities/events/MyEventsList.tsx",
  "features/dashboard/CommunitiesList.tsx",
  "features/dashboard/CommunitiesSection.tsx",
  "features/dashboard/CommunityEvents.tsx",
  "features/dashboard/Hero/HeroImageAttribution.tsx",
  "features/dashboard/MyEvents.tsx",
  "features/donations/Donations.tsx",
  "features/donations/DonationsBox.tsx",
  "features/donations/DonationsLoginPanel.tsx",
  "features/markdown/MarkdownPage.tsx",
  "features/messages/requests/HostRequestGuideLinks.tsx",
  "features/notifications/PushNotificationSettings.tsx",
  "features/profile/edit/EditProfile.tsx",
  "features/profile/view/NewHostRequest.tsx",
  "features/profile/view/leaveReference/formSteps/DidStay.tsx",
  "features/profile/view/leaveReference/formSteps/PrivateFeedback.tsx",
  "features/profile/view/leaveReference/formSteps/Text.tsx",
  "features/profile/view/leaveReference/formSteps/submit/ThankYouReference.tsx",
];

module.exports = legacyTransFiles;
