import { Alert } from "@mui/material";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { theme } from "theme";

import FriendItem from "./FriendItem";
import FriendTile from "./FriendTile";
import useFriendList from "./useFriendList";

function FriendList() {
  const { errors, isLoading, isError, data: friends } = useFriendList();
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
        errorMessage={isError ? errors.join("\n") : null}
        isLoading={isLoading}
        hasData={!!friends?.length}
        noDataMessage={t("connections:no_friends")}
      >
        {friends &&
          friends.map((friend) =>
            friend ? (
              <FriendItem
                friend={friend}
                key={friend.userId}
                onError={setError}
              />
            ) : null,
          )}
      </FriendTile>
    </>
  );
}

export default FriendList;
