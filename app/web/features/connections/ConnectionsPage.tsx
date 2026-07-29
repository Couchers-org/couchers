import { Grid, Stack } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { CONNECTIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";

import BlockedUsersList from "./friends/BlockedUsersList";
import FriendList from "./friends/FriendList";
import FriendRequestsReceived from "./friends/FriendRequestsReceived";
import FriendRequestsSent from "./friends/FriendRequestsSent";
import useFriendList from "./friends/useFriendList";

function ConnectionsPage() {
  const { t } = useTranslation([CONNECTIONS]);
  const { errors, isLoading, data: friends, refetchFriends } = useFriendList();

  return (
    <>
      <HtmlMeta title={t("connections:my_connections")} />
      <PageTitle>{t("connections:my_connections")}</PageTitle>
      {/* Your friends is the main content, so it gets the larger share and the
          rest stack beside it. */}
      <Grid
        container
        spacing={2}
        sx={{ width: "100%", alignItems: "flex-start" }}
      >
        <Grid size={{ xs: 12, md: 7 }}>
          <FriendList errors={errors} friends={friends} isLoading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            <FriendRequestsReceived />
            <FriendRequestsSent />
            <BlockedUsersList refetchFriends={refetchFriends} />
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

export default ConnectionsPage;
