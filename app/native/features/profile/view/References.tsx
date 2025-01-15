import { ThemedText } from "@/components/ThemedText";
import { View } from "react-native";
import { referencesFilterLabels } from "../constants";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import { User } from "@/proto/api_pb";
import { Picker } from "@react-native-picker/picker";
import { useListAvailableReferences } from "../hooks/referencesHooks";
import ReferencesReceivedList from "./ReferencesReceivedList";
import ReferencesGivenList from "./ReferencesGivenList";
import Button from "@/components/Button";

export type ReferenceTypeState = keyof ReturnType<
  typeof referencesFilterLabels
>;

export default function References({ user }: { user: User.AsObject }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const [referenceType, setReferenceType] = useState<ReferenceTypeState>("all");
  const { userId, friends } = user;
  const { data: availableReferences } = useListAvailableReferences(userId);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ThemedText type="title">{t("profile:heading.references")}</ThemedText>

        <Picker
          style={{ flex: 1, maxWidth: 200 }}
          selectedValue={referenceType}
          onValueChange={(itemValue) =>
            setReferenceType(itemValue as ReferenceTypeState)
          }
          accessibilityLabel={t("profile:references_filter_a11y_label")}
        >
          {Object.entries(referencesFilterLabels(t)).map(([key, label]) => {
            const value = key === "all" || key === "given" ? key : Number(key);
            return (
              <Picker.Item key={value.toString()} label={label} value={value} />
            );
          })}
        </Picker>
      </View>
      {availableReferences?.canWriteFriendReference &&
        friends === User.FriendshipStatus.FRIENDS && (
          <Button
            title="Write a reference"
            onPress={() => {
              console.log("Write a reference");
            }}
          />
        )}
      {referenceType !== "given" ? (
        <ReferencesReceivedList referenceType={referenceType} user={user} />
      ) : (
        <ReferencesGivenList user={user} />
      )}
    </View>
  );
}
