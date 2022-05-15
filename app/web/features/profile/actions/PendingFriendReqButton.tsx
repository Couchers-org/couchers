import Button from "components/Button";
import { CheckIcon, CloseIcon, PersonAddIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import type { SetMutationError } from "features/connections/friends";
import useRespondToFriendRequest from "features/connections/friends/useRespondToFriendRequest";
import { PROFILE } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { FriendRequest } from "proto/api_pb";
import React, { useRef, useState } from "react";

interface PendingFriendReqButtonProps {
  friendRequest: FriendRequest.AsObject;
  setMutationError: SetMutationError;
}

export const RESPOND_TO_FRIEND_REQUEST_MENU_ID =
  "respond-to-friend-request-actions-menu";

function PendingFriendReqButton({
  friendRequest,
  setMutationError,
}: PendingFriendReqButtonProps) {
  const [isOpen, setIsOpen] = useState({
    accepted: false,
    declined: false,
    menu: false,
  });
  const { isLoading, isSuccess, respondToFriendRequest } =
    useRespondToFriendRequest();
  const menuAnchor = useRef<HTMLButtonElement>(null);

  const handleClick = (item: keyof typeof isOpen) => () => {
    if (item === "accepted") {
      setIsOpen((prevState) => ({ ...prevState, menu: false }));
      respondToFriendRequest({
        accept: true,
        friendRequest,
        setMutationError,
      });
    } else if (item === "declined") {
      setIsOpen((prevState) => ({ ...prevState, menu: false }));
      respondToFriendRequest({
        accept: false,
        friendRequest,
        setMutationError,
      });
    } else {
      setIsOpen((prevState) => ({ ...prevState, menu: true }));
    }
  };

  const handleClose = (item: keyof typeof isOpen) => () => {
    setIsOpen((prevState) => ({ ...prevState, [item]: false }));
  };

  const { t } = useTranslation([PROFILE]);

  return (
    <>
      {isSuccess ? null : (
        <>
          <Button
            startIcon={<PersonAddIcon />}
            innerRef={menuAnchor}
            onClick={handleClick("menu")}
            aria-controls={RESPOND_TO_FRIEND_REQUEST_MENU_ID}
            loading={isLoading}
          >
            {t("profile:connection_pending")}
          </Button>
          <Menu
            anchorEl={menuAnchor.current}
            id={RESPOND_TO_FRIEND_REQUEST_MENU_ID}
            onClose={handleClose("menu")}
            open={isOpen.menu}
          >
            <MenuItem onClick={handleClick("accepted")}>
              <CheckIcon />
              {t("profile:actions.accept_friend_label")}
            </MenuItem>
            <MenuItem onClick={handleClick("declined")}>
              <CloseIcon />
              {t("profile:actions.decline_friend_label")}
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  );
}

export default PendingFriendReqButton;
