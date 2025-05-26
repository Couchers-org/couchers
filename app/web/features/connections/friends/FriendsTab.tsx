import { Grid, styled } from "@mui/material";

import BlockedUsers from "./BlockedUsers";
import FriendList from "./FriendList";
import FriendRequestsReceived from "./FriendRequestsReceived";
import FriendRequestsSent from "./FriendRequestsSent";

const StyledGrid = styled(Grid)(({ theme }) => ({
  "& > div": {
    height: "100%",
  },
}));

function FriendsTab() {
  return (
    <Grid container gap={2}>
      <StyledGrid item xs={12} md={6}>
        <FriendRequestsReceived />
      </StyledGrid>
      <StyledGrid item xs={12} md={6}>
        <FriendList />
      </StyledGrid>
      <Grid container spacing={2}>
        <StyledGrid item xs={12} md={6}>
          <FriendRequestsSent />
        </StyledGrid>
        <StyledGrid item xs={12} md={6}>
          <BlockedUsers />
        </StyledGrid>
      </Grid>
    </Grid>
  );
}

export default FriendsTab;
