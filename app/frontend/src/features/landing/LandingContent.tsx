import CircularProgress from "components/CircularProgress";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import NotFoundPage from "features/NotFoundPage";
import matter, { GrayMatterFile } from "gray-matter";
import { staticContentKey } from "queryKeys";
import { useQuery } from "react-query";
import { useLocation } from "react-router-dom";
import { markdownIndex, PageMeta } from "./markdown";

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
import MarkdownPage from "./MarkdownPage";

export default function LandingContent() {
  const path = useLocation().pathname;
  const query = useQuery<GrayMatterFile<any>, Error>(
    staticContentKey(path),
    async () => {
      const urlParts = path.split("/");
      let page = markdownIndex.find((p) => p.slug === urlParts[0]);
      for (let i = 1; i < urlParts.length; i++) {
        page = page?.children?.find((p) => p.slug === urlParts[i]);
      }
      if (!page) throw Error("404");
      const text = await (await fetch(page.file)).text();
      return matter(text);
    }
  );

  if (query.isError) {
    if (query.error.message !== "404") throw query.error;
    return <NotFoundPage />;
  }
  if (query.isLoading) return <CircularProgress />;
  if (query.isSuccess) return <MarkdownPage file={query.data} />;
  throw Error(`Invalid query status ${query.status}`);
}
