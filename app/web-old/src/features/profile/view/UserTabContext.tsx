import { TabContext } from "@material-ui/lab";
import { PropsWithChildren } from "react";
import { useParams } from "react-router-dom";
import { UserTab } from "routes";

export function isUserTab(tab: string | undefined): tab is UserTab {
  switch (tab as UserTab) {
    case "about":
    case "home":
    case "favorites":
    case "references":
    case "photos":
      return true;
  }
}

export default function UserTabContext({
  children,
}: PropsWithChildren<unknown>) {
  let { tab = "about" } = useParams<{
    tab: string;
  }>();

  const activeTab = isUserTab(tab) ? tab : "about";

  return <TabContext value={activeTab}>{children}</TabContext>;
}
