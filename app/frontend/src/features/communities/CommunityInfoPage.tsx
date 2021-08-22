import { Link as MuiLink } from "@material-ui/core";
import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import { EDIT } from "features/constants";
import { Community } from "proto/communities_pb";
import { Link } from "react-router-dom";
import { routeToEditCommunityPage } from "routes";
import makeStyles from "utils/makeStyles";

import CommunityModeratorsSection from "./CommunityModeratorsSection";
import { SectionTitle } from "./CommunityPage";
import { MAIN_PAGE_HEADING } from "./constants";

const useStyles = makeStyles((theme) => ({
  titleContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
}));

interface CommunityInfoPageProps {
  community: Community.AsObject;
}

export default function CommunityInfoPage({
  community,
}: CommunityInfoPageProps) {
  const classes = useStyles();

  return (
    <>
      <section>
        <div className={classes.titleContainer}>
          <SectionTitle icon={<InfoIcon />}>{MAIN_PAGE_HEADING(community.name)}</SectionTitle>
          {community.mainPage?.canEdit && (
            <MuiLink
              component={Link}
              to={routeToEditCommunityPage(
                community.communityId,
                community.slug
              )}
            >
              {EDIT}
            </MuiLink>
          )}
        </div>
        <Markdown
          topHeaderLevel={3}
          source={community.mainPage?.content || ""}
          allowImages="couchers"
        />
      </section>
      <CommunityModeratorsSection community={community} />
    </>
  );
}
