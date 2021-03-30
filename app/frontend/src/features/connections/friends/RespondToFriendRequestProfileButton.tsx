import React, { useRef, useState } from "react";
import { useQuery } from "react-query";
import { Error } from "grpc-web";

import useFriendRequests from "features/connections/friends/useFriendRequests";
import { FriendRequest } from "pb/api_pb";

import { makeStyles } from "@material-ui/core";
import { PersonAddIcon } from "components/Icons";
import Button from "components/Button";
import Menu, { MenuItem } from "components/Menu";
import { SetMutationError } from ".";
import { PENDING } from "features/connections/constants";
import RespondToFriendRequestAction from "features/connections/friends/FriendRequestsReceived"

const useStyles = makeStyles((theme) => ({}));

/*interface RespondToFriendRequestActionProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
}

function RespondToFriendRequestAction({
  friendRequestId,
  state,
  setMutationError,
}: RespondToFriendRequestActionProps) };{*/
/* HOW TO DO THIS:
map user id to friend request id
*/

interface RespondToFriendRequestProfileButtonProps {
  userId: number;
  setMutationError: SetMutationError;
}

export const RESPOND_TO_FRIEND_REQUEST_MENU_ID = "respond-to-friend-request-actions-menu";

function RespondToFriendRequestProfileButton({
  userId,
  setMutationError,
}: RespondToFriendRequestProfileButtonProps) {
  const [isOpen, setIsOpen] = useState({
    respond: false,
    menu: false,
  });
  const menuAnchor = useRef<HTMLButtonElement>(null);
    
  const handleClick = (item: keyof typeof isOpen) => () => {
    //close the menu if a menu item was selected
    if (item !== "menu") {
      setIsOpen((prevState) => ({ ...prevState, [item]: true, menu: false }));
    } else {
      setIsOpen((prevState) => ({ ...prevState, menu: true }));
    }
  };
    
  const handleClose = (item: keyof typeof isOpen) => () => {
    setIsOpen((prevState) => ({ ...prevState, [item]: false }));
  };

  return (
    <>
      <Button
        startIcon={<PersonAddIcon />}
        innerRef={menuAnchor}
        onClick={handleClick("menu")}
        aria-controls={RESPOND_TO_FRIEND_REQUEST_MENU_ID}
      >
        {PENDING}
      </Button>
      <Menu
        anchorEl={menuAnchor.current}
        id={RESPOND_TO_FRIEND_REQUEST_MENU_ID}
        onClose={handleClose("menu")}
        open={isOpen.menu}
      >

            <MenuItem onClick={handleClick("respond")}>{"Respond"}</MenuItem>
          
      </Menu> 
    </>
  )
};

export default RespondToFriendRequestProfileButton;
