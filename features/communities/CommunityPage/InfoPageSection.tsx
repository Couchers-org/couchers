import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

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
  const { t } = useTranslation([COMMUNITIES]);
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  return (
    <section>
      <TitleWithIcon icon={<InfoIcon />} variant="h2">
        {t("communities:general_information")}
      </TitleWithIcon>
      <Markdown topHeaderLevel={3} source={community.description} />

      <div className={classes.loadMoreButton}>
        <StyledLink
          href={routeToCommunity(community.communityId, community.slug, "info")}
        >
          {t("communities:see_more_information")}
        </StyledLink>
      </div>
    </section>
  );
}
