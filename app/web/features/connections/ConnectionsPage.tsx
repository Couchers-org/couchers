import { TabContext, TabPanel } from "@mui/lab";
import HtmlMeta from "components/HtmlMeta";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import useNotifications from "features/useNotifications";
import { CONNECTIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";
import { connectionsRoute } from "routes";

import { FriendsTab } from "./friends";

function FriendsNotification() {
  const { data } = useNotifications();
  const { t } = useTranslation([CONNECTIONS]);

  return (
    <NotificationBadge count={data?.pendingFriendRequestCount}>
      {t("connections:friends")}
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
  const { t } = useTranslation([CONNECTIONS]);

  return (
    <>
      <HtmlMeta title={t("connections:my_connections")} />
      <PageTitle>{t("connections:my_connections")}</PageTitle>
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
