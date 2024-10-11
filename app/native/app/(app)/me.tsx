import { ThemedText } from "@/components/ThemedText";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { hostingStatusLabels, meetupStatusLabels } from "@/features/profile/constants";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { Text, View, Image, SafeAreaView, Platform, StatusBar } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HostingStatus, MeetupStatus } from "@/proto/api_pb";
import { ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { hourMillis, timeAgoI18n } from "@/utils/timeAgo";
import { timestamp2Date } from "@/utils/date";
import LabelAndText from "@/components/LabelAndText";
import { AgeGenderLanguagesLabels, RemainingAboutLabels, ResponseRateLabel } from "@/features/profile/view/userLabels";

export default function Index() {
  const { authActions } = useAuthContext();
  const { t } = useTranslation(PROFILE);
  const { t: tGlobal } = useTranslation(GLOBAL);
  const insets = useSafeAreaInsets();

  const currentUser = useCurrentUser();

  const hostingStatus = currentUser?.data?.hostingStatus ?? HostingStatus.HOSTING_STATUS_UNSPECIFIED;
  const meetupStatus = currentUser?.data?.meetupStatus ?? MeetupStatus.MEETUP_STATUS_UNSPECIFIED;

  const isActiveHosting = [HostingStatus.HOSTING_STATUS_CAN_HOST, HostingStatus.HOSTING_STATUS_MAYBE].includes(hostingStatus);
  const isActiveMeetup = [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP, MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP].includes(meetupStatus);

  const [activeTab, setActiveTab] = useState('About Me');
  const activeColor = '#00A398';

  return (
    <View style={{
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {currentUser?.data?.avatarUrl && (
            <Image
              source={{ uri: currentUser.data.avatarUrl }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
              }}
            />
          )}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <ThemedText type="title">{currentUser?.data?.name}</ThemedText>
            <ThemedText type="subtitle">{currentUser?.data?.city}</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <MaterialIcons
                name="hotel"
                size={24}
                style={{
                  marginRight: 8,
                  color: isActiveHosting ? undefined : 'gray'
                }}
              />
              <ThemedText
                style={{
                  color: isActiveHosting ? undefined : 'gray'
                }}
              >
                {hostingStatusLabels(t)[hostingStatus]}
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons
                name="location-outline"
                size={24}
                style={{
                  marginRight: 8,
                  color: isActiveMeetup ? undefined : 'gray'
                }}
              />
              <ThemedText
                style={{
                  color: isActiveMeetup ? undefined : 'gray'
                }}
              >
                {meetupStatusLabels(t)[meetupStatus]}
              </ThemedText>
            </View>
          </View>

        </View>
        <View style={{
          borderBottomColor: 'gray',
          borderBottomWidth: 1,
          marginVertical: 16
        }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          {['About Me', 'My Home', 'References'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                padding: 8,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab ? activeColor : 'transparent',
              }}
            >
              <ThemedText type="defaultSemiBold" style={{ color: activeTab === tab ? activeColor : 'gray' }}>{tab}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'About Me' && (
          <View>
            <LabelAndText
              label={t("heading.references")}
              text={`${currentUser?.data?.numReferences || 0}`}
            />
            <LabelAndText
              label={t("heading.last_active")}
              text={currentUser?.data?.lastActive
                ? timeAgoI18n({
                  input: timestamp2Date(currentUser.data.lastActive),
                  t: tGlobal,
                  fuzzy: {
                  millis: hourMillis,
                  translationKey: "relative_time.less_than_one_hour_ago",
                },
              })
            : t("last_active_false")}
            />
            {currentUser?.data && <ResponseRateLabel user={currentUser.data} />}
            {currentUser?.data && <AgeGenderLanguagesLabels user={currentUser.data} />}
            {currentUser?.data && <RemainingAboutLabels user={currentUser.data} />}
          </View>
        )}
        {activeTab === 'My Home' && (
          <View>
            <ThemedText>My Home content goes here</ThemedText>
          </View>
        )}
        {activeTab === 'References' && (
          <View>
            <ThemedText>References content goes here</ThemedText>
          </View>
        )}

        <Text onPress={authActions.logout} style={{ marginTop: 16 }}>Sign Out</Text>
      </ScrollView>
    </View>
  );
}
