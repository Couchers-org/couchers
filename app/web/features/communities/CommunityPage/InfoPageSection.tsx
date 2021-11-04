import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import StyledLink from "components/StyledLink";
import { Community } from "proto/communities_pb";
import { routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

import { GENERAL_INFORMATION, SEE_MORE_INFORMATION } from "../constants";
import { useCommunityPageStyles } from "./CommunityPage";
import TitleWithIcon from "./TitleWithIcon";

interface InfoPageSectionProps {
  community: Community.AsObject;
}

const useStyles = makeStyles((theme) => ({
  summaryText: {
    marginTop: theme.spacing(1),
  },
}));

export default function InfoPageSection({ community }: InfoPageSectionProps) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  return (
    <section>
      <TitleWithIcon icon={<InfoIcon />} variant="h2">
        {GENERAL_INFORMATION}
      </TitleWithIcon>
      <Markdown topHeaderLevel={3} source={community.description} />

      <div className={classes.loadMoreButton}>
        <StyledLink
          href={routeToCommunity(community.communityId, community.slug, "info")}
        >
          {SEE_MORE_INFORMATION}
        </StyledLink>
      </div>
    </section>
  );
}
