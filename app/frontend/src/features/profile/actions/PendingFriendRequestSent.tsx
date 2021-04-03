import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import { PENDING_REQUEST_SENT } from "features/connections/constants";
import React from "react";

export default function PendingFriendRequestSent() {
  return (
    <Button startIcon={<PersonAddIcon />} disabled={true}>
      {PENDING_REQUEST_SENT}
    </Button>
  );
}
