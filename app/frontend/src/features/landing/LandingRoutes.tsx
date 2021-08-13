import CircularProgress from "components/CircularProgress";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import NotFoundPage from "features/NotFoundPage";
import matter, { GrayMatterFile } from "gray-matter";
import { staticContentKey } from "queryKeys";
import { useQuery } from "react-query";
import { useLocation } from "react-router-dom";
import { aboutRoute } from "routes";

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

const pages = new Map<string, string>([
  ["", about],
  ["contributors", contributors],
  ["caa", caa],
  ["contributors/community-builder", communityBuilder],
  ["contributors/data-policy", dataPolicy],
  ["contributors/guide", guide],
  ["contributors/nda", nda],
  ["faq", faq],
  ["features", features],
  ["foundation", foundation],
  ["issues", issues],
  ["issues/communities-and-trust", communitiesAndTrustIssue],
  ["issues/creeps-and-freeloaders", creepsAndFreeloadersIssue],
  ["issues/host-matching", hostMatchingIssue],
  ["issues/profit-and-incentive", profitAndIncentivesIssue],
  ["issues/reviews", reviewsIssue],
  ["issues/the-build", theBuildIssue],
  ["solutions", solutions],
  ["solutions/communities-and-trust", communitiesAndTrustSolution],
  ["solutions/creeps-and-freeloaders", creepsAndFreeloadersSolution],
  ["solutions/host-matching", hostMatchingSolution],
  ["solutions/profit-and-incentives", profitAndIncentivesSolution],
  ["solutions/reviews", reviewsSolution],
  ["solutions/the-build", theBuildSolution],
  ["volunteer", volunteer],
]);

export default function LandingRoutes() {
  const path = useLocation().pathname;
  const query = useQuery<GrayMatterFile<any>, Error>(
    staticContentKey(path),
    async () => {
      console.log(path?.substring(aboutRoute.length + 1));
      const url = pages.get(path?.substring(aboutRoute.length + 1));
      if (!url) throw Error("404");
      const text = await (await fetch(url)).text();
      return matter(text);
    }
  );

  if (query.isError) {
    if (query.error.message !== "404") throw query.error;
    return <NotFoundPage />;
  }
  if (query.isLoading) return <CircularProgress />;
  if (query.isSuccess)
    return (
      <>
        {query.data.data.title && (
          <PageTitle>{query.data.data.title}</PageTitle>
        )}
        <Markdown source={query.data.content} />
      </>
    );
  throw Error(`Invalid query status ${query.status}`);
}
