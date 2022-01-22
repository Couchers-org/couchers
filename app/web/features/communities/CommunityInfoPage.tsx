import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { Community } from "proto/communities_pb";
import { routeToEditCommunityPage } from "routes";
import makeStyles from "utils/makeStyles";

import CommunityModeratorsSection from "./CommunityModeratorsSection";
import { SectionTitle } from "./CommunityPage";
import { LOCAL_INFO_TITLE } from "./constants";

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
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <>
      <section>
        <div className={classes.titleContainer}>
          <SectionTitle icon={<InfoIcon />}>
            {LOCAL_INFO_TITLE(community.name)}
          </SectionTitle>
          {community.mainPage?.canEdit && (
            <StyledLink
              href={routeToEditCommunityPage(
                community.communityId,
                community.slug
              )}
            >
              {t("global:edit")}
            </StyledLink>
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
