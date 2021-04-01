import { CircularProgress } from "@material-ui/core";
import Button from "components/Button";
import IconButton from "components/IconButton";
import { CheckIcon, CloseIcon, PersonAddIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { PENDING } from "features/connections/constants";
import { FriendRequest } from "pb/api_pb";
import React, { useRef, useState } from "react";

import { SetMutationError } from ".";
import useRespondToFriendRequest from "./useRespondToFriendRequest";

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

  const {
    isLoading,
    isSuccess,
    reset,
    respondToFriendRequest,
  } = useRespondToFriendRequest();

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
        {" "}
        {isLoading || isSuccess ? (
          <CircularProgress />
        ) : (
          <>
            <MenuItem onClick={handleClick("accepted")}>
              {
                <IconButton
                  aria-label="Accept request"
                  onClick={() => {
                    reset();
                    respondToFriendRequest({
                      accept: true,
                      friendRequestId,
                      setMutationError,
                    });
                  }}
                >
                  <CheckIcon />
                </IconButton>
              }
            </MenuItem>
            <MenuItem onClick={handleClick("rejected")}>
              {
                <IconButton
                  aria-label="Decline request"
                  onClick={() => {
                    reset();
                    respondToFriendRequest({
                      accept: false,
                      friendRequestId,
                      setMutationError,
                    });
                  }}
                >
                  <CloseIcon />
                </IconButton>
              }
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  ) : null;
}

export default RespondToFriendRequestProfileButton;
