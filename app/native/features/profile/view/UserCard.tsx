import { View, TouchableOpacity, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { UserTab, userTabs } from "@/routes";
import { useProfileUser } from "../hooks/useProfileUser";
import { useState } from "react";
import About from "./About";
import References from "./References";
import Home from "./Home";
import { PROFILE } from "@/i18n/namespaces";
import { useTranslation } from "react-i18next";
import { sectionLabels } from "../constants";

export default function UserCard({ tab }: { tab: UserTab }) {
  const { t } = useTranslation([PROFILE]);
  const user = useProfileUser();

  const [activeTab, setActiveTab] = useState(tab);
  const activeColor = "#00A398";

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 16,
        }}
      >
        {userTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              padding: 8,
              borderBottomWidth: 2,
              borderBottomColor:
                activeTab === tab ? activeColor : "transparent",
            }}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: activeTab === tab ? activeColor : "gray" }}
            >
              {sectionLabels(t)[tab]}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "about" && (
        <ScrollView>
          <About user={user} />
        </ScrollView>
      )}
      {activeTab === "home" && (
        <ScrollView>
          <Home user={user} />
        </ScrollView>
      )}
      {activeTab === "references" && <References user={user} />}
    </View>
  );
}
