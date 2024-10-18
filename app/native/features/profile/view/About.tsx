import { View } from "react-native";
import { hourMillis, timeAgoI18n } from "@/utils/timeAgo";
import { timestamp2Date } from "@/utils/date";
import { useRegions } from "../hooks/useRegions";
import {
  AgeGenderLanguagesLabels,
  RemainingAboutLabels,
  ResponseRateLabel,
} from "./userLabels";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { User } from "@/proto/api_pb";
import { useTranslation } from "@/i18n";
import LabelAndText from "@/components/LabelAndText";
import { ThemedText } from "@/components/ThemedText";
import Markdown from "react-native-markdown-display";
import Divider from "@/components/Divider";

export default function About({ user }: { user: User.AsObject }) {
  const { t: tGlobal } = useTranslation(GLOBAL);
  const { t } = useTranslation(PROFILE);
  const { regions } = useRegions();

  return (
    <View style={{ paddingBottom: 10 }}>
      <LabelAndText
        label={t("heading.references")}
        text={`${user.numReferences || 0}`}
      />
      <LabelAndText
        label={t("heading.last_active")}
        text={
          user?.lastActive
            ? timeAgoI18n({
                input: timestamp2Date(user.lastActive),
                t: tGlobal,
                fuzzy: {
                  millis: hourMillis,
                  translationKey: "relative_time.less_than_one_hour_ago",
                },
              })
            : t("last_active_false")
        }
      />
      {user && <ResponseRateLabel user={user} />}
      {user && <AgeGenderLanguagesLabels user={user} />}
      {user && <RemainingAboutLabels user={user} />}
      <Divider />
      {user.aboutMe && (
        <>
          <ThemedText type="title">
            {t("profile:heading.who_section")}
          </ThemedText>
          <Markdown>{user.aboutMe}</Markdown>
          <Divider />
        </>
      )}
      {user.thingsILike && (
        <>
          <ThemedText type="title">
            {t("profile:heading.hobbies_section")}
          </ThemedText>
          <Markdown>{user.thingsILike}</Markdown>
          <Divider />
        </>
      )}
      {user.additionalInformation && (
        <>
          <ThemedText type="title">
            {t("profile:heading.additional_information_section")}
          </ThemedText>
          <Markdown>{user.additionalInformation}</Markdown>
          <Divider />
        </>
      )}
      <ThemedText type="title">
        {t("profile:heading.travel_section")}
      </ThemedText>
      <ThemedText type="default">
        {regions &&
        user.regionsVisitedList?.length != undefined &&
        user.regionsVisitedList?.length > 0
          ? user.regionsVisitedList
              .map((country) => regions[country])
              .join(`, `)
          : t("profile:regions_empty_state")}
      </ThemedText>
      <Divider />
      <ThemedText type="title">{t("profile:heading.lived_section")}</ThemedText>
      <ThemedText type="default">
        {regions &&
        user.regionsLivedList?.length != undefined &&
        user.regionsLivedList?.length > 0
          ? user.regionsLivedList.map((country) => regions[country]).join(`, `)
          : t("profile:regions_empty_state")}
      </ThemedText>
      <Divider />
      <ThemedText type="title">{t("profile:heading.map_section")}</ThemedText>
    </View>
  );
}
