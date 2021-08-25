import about from "./markdown/about.md";
import contributors from "./markdown/contributors.md";
import caa from "./markdown/contributors/caa.md";
import communityBuilder from "./markdown/contributors/community-builder.md";
import dataPolicy from "./markdown/contributors/data-policy.md";
import guide from "./markdown/contributors/guide.md";
import nda from "./markdown/contributors/nda.md";
import faq from "./markdown/faq.md";
import features from "./markdown/features.md";
import foundation from "./markdown/foundation.md";
import issues from "./markdown/issues.md";
import communitiesAndTrustIssue from "./markdown/issues/communities-and-trust.md";
import creepsAndFreeloadersIssue from "./markdown/issues/creeps-and-freeloaders.md";
import hostMatchingIssue from "./markdown/issues/host-matching.md";
import profitAndIncentivesIssue from "./markdown/issues/profit-and-incentives.md";
import reviewsIssue from "./markdown/issues/reviews.md";
import theBuildIssue from "./markdown/issues/the-build.md";
import solutions from "./markdown/solutions.md";
import communitiesAndTrustSolution from "./markdown/solutions/communities-and-trust.md";
import creepsAndFreeloadersSolution from "./markdown/solutions/creeps-and-freeloaders.md";
import hostMatchingSolution from "./markdown/solutions/host-matching.md";
import profitAndIncentivesSolution from "./markdown/solutions/profit-and-incentives.md";
import reviewsSolution from "./markdown/solutions/reviews.md";
import theBuildSolution from "./markdown/solutions/the-build.md";
import volunteer from "./markdown/volunteer.md";

export interface PageMeta {
  title: string;
  linkText: string;
  slug: string;
  file: string;
  children?: readonly PageMeta[];
  omitFromNav?: boolean;
}

export const markdownIndex: readonly PageMeta[] = [
  {
    title: "About us",
    linkText: "About us",
    slug: "about",
    file: about,
  },
  {
    title: "What Couchsurfing™ got wrong",
    linkText: "Couchsurfing™ Issues",
    slug: "issues",
    file: issues,
    children: [
      {
        title: "The profit incentives of Couchsurfing™",
        linkText: "Profit and Incentives",
        slug: "profit-and-incentives",
        file: profitAndIncentivesIssue,
      },
      {
        title: "Neglected Communities",
        linkText: "Communities and Trust",
        slug: "communities-and-trust",
        file: communitiesAndTrustIssue,
      },
      {
        title: "Member Safety and Freeloaders",
        linkText: "Safety and Freeloaders",
        slug: "creeps-and-freeloaders",
        file: creepsAndFreeloadersIssue,
      },
      {
        title: "The Reference System",
        linkText: "The Reference System",
        slug: "reviews",
        file: reviewsIssue,
      },
      {
        title: "Host Finding and the Super-Host Effect",
        linkText: "The Super-Host Effect",
        slug: "host-matching",
        file: hostMatchingIssue,
      },
      {
        title: "The Bugs and App Issues",
        linkText: "The Bugs and App Issues",
        slug: "the-build",
        file: theBuildIssue,
      },
    ],
  },
  {
    title: "Our plan for the next iteration in couch surfing",
    linkText: "Our Plan",
    slug: "solutions",
    file: solutions,
    children: [
      {
        title: "Our Non-Profit Plan",
        linkText: "Non-Profit Structure",
        slug: "profit-and-incentives",
        file: profitAndIncentivesSolution,
      },
      {
        title: "Community-first Framework and Improved Verification",
        linkText: "Community-first Framework",
        slug: "communities-and-trust",
        file: communitiesAndTrustSolution,
      },
      {
        title: "Member Accountability",
        linkText: "Member Accountability",
        slug: "creeps-and-freeloaders",
        file: creepsAndFreeloadersSolution,
      },
      {
        title: "Community Standing: Improving the Reference System",
        linkText: "Improved Review System",
        slug: "reviews",
        file: reviewsSolution,
      },
      {
        title: "Better ways to find hosts",
        linkText: "Better Host Finding",
        slug: "host-matching",
        file: hostMatchingSolution,
      },
      {
        title: "Building it right",
        linkText: "Building It Right",
        slug: "the-build",
        file: theBuildSolution,
      },
    ],
  },
  {
    title: "Features",
    linkText: "Features",
    slug: "features",
    file: features,
  },
  {
    title: "Volunteer",
    linkText: "Volunteer",
    slug: "volunteer",
    file: volunteer,
  },
  {
    title: "Frequently asked questions",
    linkText: "FAQ",
    slug: "faq",
    file: faq,
  },
  {
    title: "Couchers.org Foundation",
    linkText: "Couchers.org Foundation",
    slug: "foundation",
    file: foundation,
  },
  {
    title: "Contributors",
    linkText: "Contributors",
    slug: "contributors",
    file: contributors,
    children: [
      {
        title: "Contributor Assignment Agreement",
        linkText: "Contributor Assignment Agreement",
        slug: "caa",
        file: caa,
      },
      {
        title: "Couchers.org Community Builder Guide",
        linkText: "Couchers.org Community Builder Guide",
        slug: "community-builder",
        file: communityBuilder,
      },
      {
        title: "Contributor Data Policy",
        linkText: "Contributor Data Policy",
        slug: "data-policy",
        file: dataPolicy,
      },
      {
        title: "Contributor Guide",
        linkText: "Contributor Guide",
        slug: "guide",
        file: guide,
      },
      {
        title: "Contributor Non-Disclosure Agreement",
        linkText: "Contributor Non-Disclosure Agreement",
        slug: "nda",
        file: nda,
      },
    ],
  },
] as const;
