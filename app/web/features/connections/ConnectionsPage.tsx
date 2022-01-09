import { TabContext, TabPanel } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import useNotifications from "features/useNotifications";
import { useRouter } from "next/router";
import React from "react";
import { connectionsRoute } from "routes";

import { CONNECTIONS, FRIENDS } from "./constants";
import { FriendsTab } from "./friends";

function FriendsNotification() {
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.pendingFriendRequestCount}>
      {FRIENDS}
    </NotificationBadge>
  );
}

const labels = {
  friends: <FriendsNotification />,
};

type ConnectionType = keyof typeof labels;

function ConnectionsPage({ type }: { type: "friends" }) {
  const router = useRouter();
  const connectionType = type in labels ? (type as ConnectionType) : "friends";

  return (
    <>
      <HtmlMeta title={CONNECTIONS} />
      <PageTitle>{CONNECTIONS}</PageTitle>
      <TabContext value={connectionType}>
        <TabBar
          ariaLabel="Tabs for different connection types"
          setValue={(newType) =>
            router.push(
              `${connectionsRoute}/${newType !== "friends" ? newType : ""}`
            )
          }
          labels={labels}
        />
        <TabPanel value="friends">
          <FriendsTab />
        </TabPanel>
      </TabContext>
    </>
  );
}

export default ConnectionsPage;
