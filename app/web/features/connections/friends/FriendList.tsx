import { Alert } from "@mui/material";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { useState } from "react";
import { theme } from "theme";

import FriendItem from "./FriendItem";
import FriendTile from "./FriendTile";

function FriendList({
  errors,
  friends,
  isLoading,
}: {
  errors: string[];
  friends: LiteUser.AsObject[] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation([GLOBAL, CONNECTIONS]);

  const [error, setError] = useState<Error | null>(null);

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
          {error.message}
        </Alert>
      )}
      <FriendTile
        title={t("connections:friend_list_title")}
        errorMessage={errors.length > 0 ? errors.join("\n") : null}
        isLoading={isLoading}
        hasData={!!friends?.length}
        noDataMessage={t("connections:no_friends")}
      >
        {friends && friends.map((friend) => <FriendItem friend={friend} key={friend.userId} onError={setError} />)}
      </FriendTile>
    </>
  );
}

export default FriendList;
