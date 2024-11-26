import { TabContext } from "@mui/lab";
import { PropsWithChildren } from "react";
import { UserTab } from "routes";

export default function UserTabContext({
  children,
  tab = "about",
}: PropsWithChildren<{ tab: UserTab }>) {
  return <TabContext value={tab}>{children}</TabContext>;
}
