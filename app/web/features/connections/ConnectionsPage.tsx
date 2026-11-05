import { Box, Stack } from "@mui/material";
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
          rest stack beside it. On mobile, requests to answer come first. */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "start",
          gridTemplateAreas: { xs: `"received" "friends" "others"`, md: `"friends received" "friends others"` },
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 7fr) minmax(0, 5fr)" },
          // the second row takes any extra height, so no gap opens under requests
          gridTemplateRows: { md: "auto 1fr" },
        }}
      >
        <Box sx={{ gridArea: "friends" }}>
          <FriendList errors={errors} friends={friends} isLoading={isLoading} />
        </Box>
        <Box sx={{ gridArea: "received" }}>
          <FriendRequestsReceived isContentAboveLoaded={!isLoading} />
        </Box>
        <Stack spacing={2} sx={{ gridArea: "others" }}>
          <FriendRequestsSent />
          <BlockedUsersList refetchFriends={refetchFriends} />
        </Stack>
      </Box>
    </>
  );
}

export default ConnectionsPage;
