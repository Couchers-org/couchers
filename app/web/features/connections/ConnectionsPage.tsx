import { TabContext, TabPanel } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import useNotifications from "features/useNotifications";
import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import React from "react";
import { connectionsRoute } from "routes";

import { FriendsTab } from "./friends";

function FriendsNotification() {
  const { t } = useTranslation(CONNECTIONS);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.pendingFriendRequestCount}>
      {t("friends_title")}
    </NotificationBadge>
  );
}

const labels = {
  friends: <FriendsNotification />,
};

type ConnectionType = keyof typeof labels;

function ConnectionsPage({ type }: { type: "friends" }) {
  const { t } = useTranslation(CONNECTIONS);
  const router = useRouter();
  const connectionType = type in labels ? (type as ConnectionType) : "friends";

  return (
    <>
      <HtmlMeta title={t("connections_title")} />
      <PageTitle>{t("connections_title")}</PageTitle>
      <TabContext value={connectionType}>
        <TabBar
          ariaLabel={t("connections_tab_bar_a11y_label")}
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
