import WebEmbed from "@/components/WebEmbed";
import { TabBarIcon } from "@/components/TabBarIcon";

export const options = {
  title: "Search",
  tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
    <TabBarIcon name={focused ? "search" : "search-outline"} color={color} />
  ),
};

export default function Screen() {
  return <WebEmbed path="/search" />;
}
