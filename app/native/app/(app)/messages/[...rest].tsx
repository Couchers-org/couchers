import React, { ReactNode } from "react";
import { View, Platform, StatusBar, Text } from "react-native";
import { messageTypeStrings } from "@/routes";
import { router, useLocalSearchParams } from "expo-router";
import GroupChatsTab from "@/features/messages/groupschats/GroupChatsTab";
import MessagesHeader from "@/features/messages/MessagesHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GroupChatView from "@/features/messages/groupschats/GroupChatView";
import RequestsTab from "@/features/messages/requests/RequestsTab";
import HostRequestView from "@/features/messages/requests/HostRequestView";

export default function LeaveReferencePage() {
    const insets = useSafeAreaInsets();
  const { rest } = useLocalSearchParams();
  console.log(rest);
  const slugs = (rest as string[]) || ["chats"];
  const tab = messageTypeStrings.find((valid) => valid === slugs?.[0]);

  return (

    <View  style={{
        flex: 1,
        paddingTop:
          Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
       {!slugs[1] && <MessagesHeader tab={tab} />}
      {parseSlugs(slugs)}
    </View>
  );
}

function parseSlugs(slugs: string[]) {
  let content: ReactNode;
  if (slugs[0] === "chats") {
    const id = Number.parseInt(slugs?.[1]);
    return isNaN(id) ? <GroupChatsTab /> : <GroupChatView chatId={id} />;
  }

  if (slugs[0] === "request") {
    const id = Number.parseInt(slugs?.[1]);
    if (isNaN(id)) {
      router.push("/not-found" as any);
      return;
    }

    return <HostRequestView hostRequestId={id} />;
  }

  if (slugs[0] === "hosting") {
    return <RequestsTab type="hosting" />;
  }
  if (slugs[0] === "surfing") {
    return <RequestsTab type="surfing" />;
  }

  return content;
}
