import { InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { Community } from "pb/communities_pb";
import makeStyles from "utils/makeStyles";

import CommunityModeratorsSection from "./CommunityModeratorsSection";
import { GENERAL_INFORMATION } from "./constants";

const useStyles = makeStyles((theme) => ({
  title: {
    alignItems: "center",
    display: "flex",
    "& > * + *": {
      marginInlineStart: theme.spacing(1),
    },
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
      <div className={classes.title}>
        <InfoIcon />
        <PageTitle>{GENERAL_INFORMATION}</PageTitle>
      </div>
      <Markdown topHeaderLevel={3} source={community.mainPage?.content || ""} />
      <CommunityModeratorsSection community={community} />
    </>
  );
}
