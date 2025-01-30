import { View } from 'react-native';
import { Menu } from 'react-native-paper';
import { PROFILE } from "i18n/namespaces";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import type { SetMutationError } from "@/features/connections/friends";
import useRespondToFriendRequest from "@/features/connections/friends/useRespondToFriendRequest";
import { FriendRequest } from "proto/api_pb";
import Button from '@/components/Button';

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
  const [visible, setVisible] = useState(false);
  const { isLoading, isSuccess, respondToFriendRequest } = useRespondToFriendRequest();
  const { t } = useTranslation([PROFILE]);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleResponse = (accept: boolean) => {
    respondToFriendRequest({
      accept,
      friendRequest,
      setMutationError,
    });
    closeMenu();
  };

  if (isSuccess) {
    return null;
  }

  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            loading={isLoading}
            onPress={openMenu}
            title={t("profile:connection_pending")}
          />
        }
      >
        <Menu.Item
          onPress={() => handleResponse(true)}
          title={t("profile:actions.accept_friend_label")}
        />
        <Menu.Item
          onPress={() => handleResponse(false)}
          title={t("profile:actions.decline_friend_label")}
        />
      </Menu>
    </View>
  );
}

export default PendingFriendReqButton;
