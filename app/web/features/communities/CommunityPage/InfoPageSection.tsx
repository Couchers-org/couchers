import { styled } from "@mui/material";
import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import StyledLink from "components/StyledLink";
import { Community } from "couchers/proto/communities_pb";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { routeToCommunity } from "routes";

import TitleWithIcon from "./TitleWithIcon";

interface InfoPageSectionProps {
  community: Community.AsObject;
}

const StyledLoadMoreButton = styled("div")(() => ({
  alignSelf: "center",
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

export default function InfoPageSection({ community }: InfoPageSectionProps) {
  const { t } = useTranslation([COMMUNITIES]);

  return (
    <section>
      <TitleWithIcon icon={<InfoIcon />} variant="h2">
        {t("communities:community_info_page_title")}
      </TitleWithIcon>
      <Markdown topHeaderLevel={3} source={community.description} />

      <StyledLoadMoreButton>
        <StyledLink
          href={routeToCommunity(community.communityId, community.slug, "info")}
        >
          {t("communities:see_more_information")}
        </StyledLink>
      </StyledLoadMoreButton>
    </section>
  );
}
