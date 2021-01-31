import { Box, IconButton } from "@material-ui/core";
import React from "react";

import { CloseIcon, EmailIcon } from "../../../components/Icons";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendList from "./useFriendList";

function CurrentFriendAction() {
  return (
    <Box>
      <IconButton aria-label="Direct message">
        <EmailIcon />
      </IconButton>
      <IconButton aria-label="Unfriend">
        <CloseIcon />
      </IconButton>
    </Box>
  );
}

function FriendList() {
  const { errors, isLoading, isError, data: friends } = useFriendList();

  return (
    <FriendTile
      title="Your friends"
      errorMessage={isError ? errors.join("\n") : null}
      isLoading={isLoading}
      hasData={!!friends?.length}
      noDataMessage="No friends available :("
    >
      {friends &&
        friends.map((friend) =>
          friend ? (
            <FriendSummaryView key={friend.userId} friend={friend}>
              <CurrentFriendAction />
            </FriendSummaryView>
          ) : null
        )}
    </FriendTile>
  );
}

export default FriendList;
