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

export const aboutIndex = [
  {
    title: "About us",
    slug: "",
    file: about,
  },
  {
    title: "What Couchsurfing™ got wrong",
    slug: "issues",
    file: issues,
    children: [
      {
        title: "The profit incentives of Couchsurfing™",
        slug: "profit-and-incentives",
        file: profitAndIncentivesIssue,
      },
      {
        title: "Neglected Communities",
        slug: "communities-and-trust",
        file: communitiesAndTrustIssue,
      },
      {
        title: "Member Safety and Freeloaders",
        slug: "creeps-and-freeloaders",
        file: creepsAndFreeloadersIssue,
      },
      {
        title: "The Reference System",
        slug: "reviews",
        file: reviewsIssue,
      },
      {
        title: "Host Finding and the Super-Host Effect",
        slug: "host-matching",
        file: hostMatchingIssue,
      },
      {
        title: "The Bugs and App Issues",
        slug: "the-build",
        file: theBuildIssue,
      },
    ],
  },
  {
    title: "Our plan for the next iteration in couch surfing",
    slug: "solutions",
    file: solutions,
    children: [
      {
        title: "Our Non-Profit Plan",
        slug: "profit-and-incentives",
        file: profitAndIncentivesSolution,
      },
      {
        title: "Community-first Framework and Improved Verification",
        slug: "communities-and-trust",
        file: communitiesAndTrustSolution,
      },
      {
        title: "Member Accountability",
        slug: "creeps-and-freeloaders",
        file: creepsAndFreeloadersSolution,
      },
      {
        title: "Community Standing: Improving the Reference System",
        slug: "reviews",
        file: reviewsSolution,
      },
      {
        title: "Better ways to find hosts",
        slug: "host-matching",
        file: hostMatchingSolution,
      },
      {
        title: "Building it Right",
        slug: "the-build",
        file: theBuildSolution,
      },
    ],
  },
  {
    title: "Features",
    slug: "features",
    file: features,
  },
  {
    title: "Volunteer",
    slug: "volunteer",
    file: volunteer,
  },
  {
    title: "Frequently asked questions",
    slug: "faq",
    file: faq,
  },
  {
    title: "Couchers.org Foundation",
    slug: "foundation",
    file: foundation,
  },
  {
    title: "Contributors",
    slug: "contributors",
    file: contributors,
    children: [
      {
        title: "Contributor Assignment Agreement",
        slug: "caa",
        file: caa,
      },
      {
        title: "Couchers.org Community Builder Guide",
        slug: "community-builder",
        file: communityBuilder,
      },
      {
        title: "Contributor Data Policy",
        slug: "data-policy",
        file: dataPolicy,
      },
      {
        title: "Contributor Guide",
        slug: "guide",
        file: guide,
      },
      {
        title: "Contributor Non-Disclosure Agreement",
        slug: "nda",
        file: nda,
      },
    ],
  },
] as const;
