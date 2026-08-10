import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import { PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { FriendRequest } from "proto/api_pb";
import React from "react";
import { connectionsRoute } from "routes";

interface PendingFriendReqButtonProps {
  friendRequest: FriendRequest.AsObject;
}

function PendingFriendReqButton({ friendRequest }: PendingFriendReqButtonProps) {
  const { t } = useTranslation([PROFILE]);

  return (
    <Button component={Link} startIcon={<PersonAddIcon />} href={`${connectionsRoute}?from=${friendRequest.userId}`}>
      {t("profile:connection_pending")}
    </Button>
  );
}

export default PendingFriendReqButton;
