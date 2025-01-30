import { styled } from "@mui/material";
import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { routeToEditCommunityPage } from "routes";

import CommunityModeratorsSection from "./CommunityModeratorsSection";
import { SectionTitle } from "./CommunityPage";

const StyledTitleContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "space-between",
}));

interface CommunityInfoPageProps {
  community: Community.AsObject;
}

export default function CommunityInfoPage({
  community,
}: CommunityInfoPageProps) {
  const { t } = useTranslation([COMMUNITIES, GLOBAL]);

  return (
    <>
      <section>
        <StyledTitleContainer>
          <SectionTitle icon={<InfoIcon />}>
            {t("communities:local_info_title", { name: community.name })}
          </SectionTitle>
          {community.mainPage?.canEdit && (
            <StyledLink
              href={routeToEditCommunityPage(
                community.communityId,
                community.slug,
              )}
            >
              {t("global:edit")}
            </StyledLink>
          )}
        </StyledTitleContainer>
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
