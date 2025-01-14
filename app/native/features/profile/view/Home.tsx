import LabelAndText from "@/components/LabelAndText";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { User } from "@/proto/api_pb";
import { View } from "react-native";
import {
  booleanConversion,
  parkingDetailsLabels,
  sleepingArrangementLabels,
  smokingLocationLabels,
} from "../constants";
import Divider from "@/components/Divider";
import Markdown from "react-native-markdown-display";

export default function Home({ user }: { user: User.AsObject }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  return (
    <View style={{ paddingBottom: 10 }}>
      <ThemedText type="title">
        {t("profile:home_info_headings.hosting_preferences")}
      </ThemedText>
      <LabelAndText
        label={t("profile:home_info_headings.last_minute")}
        text={booleanConversion(t, user.lastMinute?.value)}
      />
      <LabelAndText
        label={t("profile:home_info_headings.wheelchair")}
        text={booleanConversion(t, user.wheelchairAccessible?.value)}
      />
      <LabelAndText
        label={t("profile:edit_home_questions.accept_camping")}
        text={booleanConversion(t, user.campingOk?.value)}
      />
      <LabelAndText
        label={t("profile:home_info_headings.max_guests")}
        text={`${user.maxGuests?.value || t("profile:unspecified_info")}`}
      />
      <LabelAndText
        label={t("profile:edit_home_questions.accept_kids")}
        text={booleanConversion(t, user.acceptsKids?.value)}
      />
      <LabelAndText
        label={t("profile:edit_home_questions.accept_pets")}
        text={booleanConversion(t, user.acceptsPets?.value)}
      />
      <LabelAndText
        label={t("profile:edit_home_questions.accept_drinking")}
        text={booleanConversion(t, user.drinkingAllowed?.value)}
      />
      <LabelAndText
        label={t("profile:edit_home_questions.accept_smoking")}
        text={`${smokingLocationLabels(t)[user.smokingAllowed]}`}
      />
      <Divider />
      <ThemedText type="title">
        {t("profile:home_info_headings.my_home")}
      </ThemedText>
      <LabelAndText
        label={t("profile:home_info_headings.space")}
        text={`${sleepingArrangementLabels(t)[user.sleepingArrangement]}`}
      />
      <LabelAndText
        label={t("profile:home_info_headings.parking")}
        text={booleanConversion(t, user.parking?.value)}
      />
      <LabelAndText
        label={t("profile:home_info_headings.parking_details")}
        text={parkingDetailsLabels(t)[user.parkingDetails]}
      />
      <LabelAndText
        label={t("profile:home_info_headings.has_housemates")}
        text={`${booleanConversion(t, user.hasHousemates?.value)}${
          user.housemateDetails?.value
            ? `, ${user.housemateDetails?.value}`
            : ""
        }`}
      />
      <LabelAndText
        label={t("profile:home_info_headings.host_kids")}
        text={`${booleanConversion(t, user.hasKids?.value)}${
          user.kidDetails?.value ? `, ${user.kidDetails?.value}` : ""
        }`}
      />
      <LabelAndText
        label={t("profile:home_info_headings.host_pets")}
        text={`${booleanConversion(t, user.hasPets?.value)}${
          user.petDetails?.value ? `, ${user.petDetails?.value}` : ""
        }`}
      />
      <LabelAndText
        label={t("profile:home_info_headings.host_drinking")}
        text={booleanConversion(t, user.drinksAtHome?.value)}
      />
      <LabelAndText
        label={t("profile:home_info_headings.host_smoking")}
        text={booleanConversion(t, user.smokesAtHome?.value)}
      />

      <Divider />

      {user.area && (
        <>
          <ThemedText type="title">
            {t("profile:home_info_headings.local_area")}
          </ThemedText>
          <Markdown>{user.area?.value}</Markdown>
          <Divider />
        </>
      )}
      {user.sleepingDetails && (
        <>
          <ThemedText type="title">
            {t("profile:home_info_headings.sleeping_arrangement")}
          </ThemedText>
          <Markdown>{user.sleepingDetails?.value}</Markdown>
          <Divider />
        </>
      )}
      {user.houseRules && (
        <>
          <ThemedText type="title">
            {t("profile:home_info_headings.house_rules")}
          </ThemedText>
          <Markdown>{user.houseRules?.value}</Markdown>
          <Divider />
        </>
      )}
      {user.otherHostInfo && (
        <>
          <ThemedText type="title">
            {t("profile:heading.additional_information_section")}
          </ThemedText>
          <Markdown>{user.otherHostInfo?.value}</Markdown>
        </>
      )}
    </View>
  );
}
