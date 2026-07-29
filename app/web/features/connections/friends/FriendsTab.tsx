import { Grid, styled } from "@mui/material";

import BlockedUsersList from "./BlockedUsersList";
import FriendList from "./FriendList";
import FriendRequestsReceived from "./FriendRequestsReceived";
import FriendRequestsSent from "./FriendRequestsSent";
import useFriendList from "./useFriendList";

const StyledGrid = styled(Grid)({
  "& > div": {
    height: "100%",
  },
});

function FriendsTab() {
  const { errors, isLoading, data: friends, refetchFriends } = useFriendList();

  return (
    <Grid
      container
      sx={{
        flexDirection: "column",
        gap: 2,
        width: "100%",
      }}
    >
      <StyledGrid size={{ xs: 12, md: 6 }}>
        <FriendRequestsReceived />
      </StyledGrid>
      <StyledGrid size={{ xs: 12, md: 6 }}>
        <FriendList errors={errors} friends={friends} isLoading={isLoading} />
      </StyledGrid>
      <Grid container spacing={2}>
        <StyledGrid size={{ xs: 12, md: 6 }}>
          <FriendRequestsSent />
        </StyledGrid>
        <StyledGrid size={{ xs: 12, md: 6 }}>
          <BlockedUsersList refetchFriends={refetchFriends} />
        </StyledGrid>
      </Grid>
    </Grid>
  );
}

export default FriendsTab;
