//import { CircularProgress } from "@material-ui/core";
import Button from "components/Button";
import IconButton from "components/IconButton";
import { CheckIcon, CloseIcon, PersonAddIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { PENDING } from "features/connections/constants";
import { SetMutationError } from "features/connections/friends";
import useRespondToFriendRequest from "features/connections/friends/useRespondToFriendRequest";
import { ACCEPT_REQUEST, DECLINE_REQUEST } from "features/profile/constants";
import { FriendRequest } from "pb/api_pb";
import React, { useRef, useState } from "react";

interface RespondToFriendRequestProfileButtonProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
}

export const RESPOND_TO_FRIEND_REQUEST_MENU_ID =
  "respond-to-friend-request-actions-menu";

function RespondToFriendRequestProfileButton({
  friendRequestId,
  state,
  setMutationError,
}: RespondToFriendRequestProfileButtonProps) {
  const [isOpen, setIsOpen] = useState({
    accepted: false,
    rejected: false,
    menu: false,
  });

  const { respondToFriendRequest } = useRespondToFriendRequest();

  const menuAnchor = useRef<HTMLButtonElement>(null);

  const handleClick = (item: keyof typeof isOpen) => () => {
    //close the menu if a menu item was selected
    if (item !== "menu") {
      setIsOpen((prevState) => ({ ...prevState, menu: false }));
    } else {
      setIsOpen((prevState) => ({ ...prevState, menu: true }));
    }
  };

  const handleClose = (item: keyof typeof isOpen) => () => {
    setIsOpen((prevState) => ({ ...prevState, [item]: false }));
  };

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
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
        <MenuItem onClick={handleClick("accepted")}>
          <IconButton
            aria-label={ACCEPT_REQUEST}
            onClick={() => {
              respondToFriendRequest({
                accept: true,
                friendRequestId,
                setMutationError,
              });
            }}
          >
            <CheckIcon />
          </IconButton>
        </MenuItem>
        <MenuItem onClick={handleClick("rejected")}>
          <IconButton
            aria-label={DECLINE_REQUEST}
            onClick={() => {
              respondToFriendRequest({
                accept: false,
                friendRequestId,
                setMutationError,
              });
            }}
          >
            <CloseIcon />
          </IconButton>
        </MenuItem>
      </Menu>
    </>
  ) : null;
}

export default RespondToFriendRequestProfileButton;
