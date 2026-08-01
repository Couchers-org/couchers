import {
  CouchersIcon,
  EmailIcon,
  GlobeIcon,
  LinkedInIcon,
} from "components/Icons";
import { GetMyVolunteerInfoRes } from "couchers/proto/account_pb";

// Constants
export const LINK_TYPES = ["couchers", "email", "linkedin", "website"] as const;
export type LinkType = (typeof LINK_TYPES)[number];

// Validation patterns
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_PATTERN = /^https?:\/\/.+/;
export const LINKEDIN_USERNAME_PATTERN = /^[\w-]{3,100}$/;

// Form types
export interface VolunteerFormData {
  overrideName: boolean;
  displayName: string;
  overrideLocation: boolean;
  displayLocation: string;
  showOnTeamPage: boolean;
  linkType: LinkType;
  linkText: string;
  linkUrl: string;
}

// Type guard
export function isValidLinkType(value: string): value is LinkType {
  return LINK_TYPES.includes(value as LinkType);
}

// Helper functions
export function getLinkTypeIcon(linkType: string) {
  switch (linkType) {
    case "linkedin":
      return LinkedInIcon;
    case "email":
      return EmailIcon;
    case "couchers":
      return CouchersIcon;
    default:
      return GlobeIcon;
  }
}

// Transform API data to form defaults
export function getFormDefaultValues(
  volunteerInfo?: GetMyVolunteerInfoRes.AsObject,
): VolunteerFormData {
  if (!volunteerInfo) {
    return {
      overrideName: false,
      displayName: "",
      overrideLocation: false,
      displayLocation: "",
      showOnTeamPage: true,
      linkType: "couchers",
      linkText: "",
      linkUrl: "",
    };
  }

  const linkType =
    volunteerInfo.linkType && isValidLinkType(volunteerInfo.linkType)
      ? volunteerInfo.linkType
      : "couchers";

  return {
    overrideName: false,
    displayName: volunteerInfo.displayName || "",
    overrideLocation: false,
    displayLocation: volunteerInfo.displayLocation || "",
    showOnTeamPage: volunteerInfo.showOnTeamPage,
    linkType,
    linkText: volunteerInfo.linkText || "",
    linkUrl: volunteerInfo.linkUrl || "",
  };
}
