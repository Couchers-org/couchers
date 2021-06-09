import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import { CommunityLeadersIcon } from "components/Icons";
import UserSummary from "components/UserSummary";
import { Community } from "proto/communities_pb";
import { useState } from "react";
import makeStyles from "utils/makeStyles";

import CommunityModeratorsDialog from "./CommunityModeratorsDialog";
import { SectionTitle } from "./CommunityPage";
import {
  COMMUNITY_MODERATORS,
  NO_MODERATORS,
  SEE_ALL_MODERATORS,
} from "./constants";
import { useListAdmins } from "./hooks";

const useStyles = makeStyles((theme) => ({
  section: {
    display: "grid",
    rowGap: theme.spacing(2),
  },
  loadMoreModeratorsButton: {
    justifySelf: "center",
  },
  moderatorsContainer: {
    display: "grid",
    gap: theme.spacing(3),
    gridTemplateColumns: `repeat(auto-fit, minmax(auto, 21.875rem))`,
  },
}));

interface CommunityModeratorsSectionProps {
  community: Community.AsObject;
}

export default function CommunityModeratorsSection({
  community,
}: CommunityModeratorsSectionProps) {
  const classes = useStyles();
  const { adminIds, adminUsers, error, isLoading, hasNextPage } = useListAdmins(
    community.communityId,
    "summary"
  );
  const [isModeratorsDialogOpen, setIsModeratorsDialogOpen] = useState(false);

  return (
    <section className={classes.section}>
      <SectionTitle icon={<CommunityLeadersIcon />} variant="h2">
        {COMMUNITY_MODERATORS}
      </SectionTitle>
      {error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : isLoading ? (
        <CircularProgress />
      ) : adminIds && adminIds.length > 0 ? (
        adminUsers && (
          <div className={classes.moderatorsContainer}>
            {adminIds.map((id) => (
              <UserSummary
                avatarIsLink
                nameOnly
                smallAvatar
                key={id}
                headlineComponent="h3"
                user={adminUsers.get(id)}
              />
            ))}
          </div>
        )
      ) : (
        <Typography variant="body1">{NO_MODERATORS}</Typography>
      )}
      {hasNextPage && (
        <>
          <Button
            className={classes.loadMoreModeratorsButton}
            onClick={() => setIsModeratorsDialogOpen(true)}
          >
            {SEE_ALL_MODERATORS}
          </Button>
          <CommunityModeratorsDialog
            community={community}
            onClose={() => setIsModeratorsDialogOpen(false)}
            open={isModeratorsDialogOpen}
          />
        </>
      )}
    </section>
  );
}
