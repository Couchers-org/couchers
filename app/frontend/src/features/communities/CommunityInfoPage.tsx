import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import { Community } from "proto/communities_pb";
import makeStyles from "utils/makeStyles";

import CommunityModeratorsSection from "./CommunityModeratorsSection";
import { SectionTitle } from "./CommunityPage";
import { GENERAL_INFORMATION } from "./constants";

const useStyles = makeStyles((theme) => ({}));

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
        <SectionTitle icon={<InfoIcon />}>{GENERAL_INFORMATION}</SectionTitle>
        <Markdown
          topHeaderLevel={3}
          source={community.mainPage?.content || ""}
        />
      </section>
      <CommunityModeratorsSection community={community} />
    </>
  );
}
