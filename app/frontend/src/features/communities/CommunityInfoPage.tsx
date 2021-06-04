import { Typography } from "@material-ui/core";
import { CommunityLeadersIcon, InfoIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import UserSummary from "components/UserSummary";
import useUsers from "features/userQueries/useUsers";
import { Community } from "pb/communities_pb";
import makeStyles from "utils/makeStyles";

import { SectionTitle } from "./CommunityPage";
import {
  COMMUNITY_LEADERS,
  COMMUNITY_LEADERS_DESCRIPTION,
  COMMUNITY_MODERATORS,
  GENERAL_INFORMATION,
  NO_MODERATORS,
} from "./constants";
import { useListAdmins } from "./hooks";

const useStyles = makeStyles((theme) => ({
  title: {
    alignItems: "center",
    display: "flex",
    "& > * + *": {
      marginInlineStart: theme.spacing(1),
    },
  },
  content: {
    "& p": {
      margin: 0,
    },
  },
  section: {
    "& > * + *": {
      marginTop: theme.spacing(2),
    },
  },
  moderatorsContainer: {
    display: "grid",
    gap: theme.spacing(3),
    gridTemplateColumns: `repeat(auto-fit, minmax(auto, 21.875rem))`,
  },
}));

interface CommunityInfoPageProps {
  community: Community.AsObject;
}

export default function CommunityInfoPage({
  community,
}: CommunityInfoPageProps) {
  const classes = useStyles();

  const { data } = useListAdmins(community.communityId);
  const adminIds = data?.pages.flatMap((page) => page.adminUserIdsList);
  const { data: adminUsers } = useUsers(adminIds ?? []);

  return (
    <>
      <div className={classes.title}>
        <InfoIcon />
        <PageTitle>{GENERAL_INFORMATION}</PageTitle>
      </div>
      <Markdown
        className={classes.content}
        topHeaderLevel={3}
        source={community.mainPage?.content || ""}
      />
      <section className={classes.section}>
        <SectionTitle icon={<CommunityLeadersIcon />}>
          {COMMUNITY_LEADERS}
        </SectionTitle>
        <Typography variant="body1">{COMMUNITY_LEADERS_DESCRIPTION}</Typography>
        <Typography variant="h3">{COMMUNITY_MODERATORS}</Typography>
        {adminIds && adminIds.length > 0 ? (
          adminUsers && (
            <div className={classes.moderatorsContainer}>
              {adminIds.map((id) => (
                <UserSummary compact key={id} user={adminUsers.get(id)} />
              ))}
            </div>
          )
        ) : (
          <Typography variant="body1">{NO_MODERATORS}</Typography>
        )}
      </section>
    </>
  );
}
