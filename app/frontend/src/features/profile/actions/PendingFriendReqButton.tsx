import { CircularProgress } from "@material-ui/core";
import Button from "components/Button";
import { CheckIcon, CloseIcon, PersonAddIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { PENDING } from "features/connections/constants";
import { SetMutationError } from "features/connections/friends";
import useRespondToFriendRequest from "features/connections/friends/useRespondToFriendRequest";
import {
  ACCEPT_FRIEND_ACTION,
  ACCEPT_FRIEND_LABEL,
  DECLINE_FRIEND_ACTION,
  DECLINE_FRIEND_LABEL,
} from "features/profile/constants";
import { FriendRequest } from "pb/api_pb";
import React, { useRef, useState } from "react";

interface PendingFriendReqButtonProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
}

export const RESPOND_TO_FRIEND_REQUEST_MENU_ID =
  "respond-to-friend-request-actions-menu";

function PendingFriendReqButton({
  friendRequestId,
  state,
  setMutationError,
}: PendingFriendReqButtonProps) {
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
    { isLoading || isSuccess ? (
      <CircularProgress />
    ) : (
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
          <Button
            startIcon={<CheckIcon />}
            aria-label={ACCEPT_FRIEND_LABEL}
            onClick={() => {
              reset();
              respondToFriendRequest({
                accept: true,
                friendRequestId,
                setMutationError,
              });
            }}
          >
            {ACCEPT_FRIEND_ACTION}
          </Button>
        </MenuItem>
        <MenuItem onClick={handleClick("rejected")}>
          <Button
            startIcon={<CloseIcon />}
            aria-label={DECLINE_FRIEND_LABEL}
            onClick={() => {
              reset();
              respondToFriendRequest({
                accept: false,
                friendRequestId,
                setMutationError,
              });
            }}
          >
            {DECLINE_FRIEND_ACTION}
          </Button>
        </MenuItem>
      </Menu>
    </>
    )}
    </>
  ) : null;
}

export default PendingFriendReqButton;
