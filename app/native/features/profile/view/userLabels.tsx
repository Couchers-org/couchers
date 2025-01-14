import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import dayjs from "utils/dayjs";
import LabelAndText from '../../../components/LabelAndText';
import { responseRateKey } from '@/features/queryKeys';
import {  User } from '@/proto/api_pb';
import { service } from '@/service';
import { useLanguages } from '../hooks/useLanguages';
import { COMMUNITIES, GLOBAL, PROFILE } from '@/i18n/namespaces';
import { dateTimeFormatter, timestamp2Date } from '@/utils/date';


interface Props {
    user: User.AsObject;
  }

export const ResponseRateLabel = ({ user }: Props) => {
    const { t } = useTranslation("profile");
    const query = useQuery(responseRateKey(user.userId), () =>
      service.requests.getResponseRate(user.userId)
    );

    let rateText = undefined;
    let timeText = undefined;

    if (query?.data?.insufficientData) {
      rateText = t("response_rate_text_insufficient");
    } else if (query?.data?.low) {
      rateText = t("response_rate_text_low");
    } else if (query?.data?.some) {
      rateText = t("response_rate_text_some");
      timeText = t("response_time_text_some", {
        p33: dayjs
          .duration(query.data.some.responseTimeP33!.seconds, "second")
          .humanize(),
      });
    } else if (query?.data?.most) {
      rateText = t("response_rate_text_most");
      timeText = t("response_time_text_most", {
        p33: dayjs
          .duration(query.data.most.responseTimeP33!.seconds, "second")
          .humanize(),
        p66: dayjs
          .duration(query.data.most.responseTimeP66!.seconds, "second")
          .humanize(),
      });
    } else if (query?.data?.almostAll) {
      rateText = t("response_rate_text_almost_all");
      timeText = t("response_time_text_almost_all", {
        p33: dayjs
          .duration(query.data.almostAll.responseTimeP33!.seconds, "second")
          .humanize(),
        p66: dayjs
          .duration(query.data.almostAll.responseTimeP66!.seconds, "second")
          .humanize(),
      });
    }

    return (
      <View>
        <LabelAndText label={t("response_rate_label")} text={rateText ?? ""} />
        {timeText && (
          <LabelAndText label={t("response_time_label")} text={timeText} />
        )}
      </View>
    );
  };


const AgeAndGenderRenderer = ({ user }: Props) => {
  const {
    age,
    gender,
    pronouns,
  } = user;

  return (
    <>
      <Text>{age}/</Text>
      <Text>{gender}</Text>
      <Text> {pronouns && `(${pronouns})`}</Text>
    </>
  );
};


  export const AgeGenderLanguagesLabels = ({ user }: Props) => {
    const { t } = useTranslation("profile");
    const { languages } = useLanguages();

    return (
      <>
        <LabelAndText
          label={t("heading.age_gender")}
          text={<AgeAndGenderRenderer user={user} />}
        />
        {languages && (
          <LabelAndText
            label={t("heading.languages_fluent")}
            text={
              user.languageAbilitiesList
                .map((ability) => languages[ability.code])
                .join(", ") || t("languages_fluent_false")
            }
          />
        )}
      </>
    );
  };



export const RemainingAboutLabels = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);
  return (
    <>
      <LabelAndText
        label={t("profile:heading.hometown")}
        text={user.hometown}
      />
      <LabelAndText
        label={t("profile:heading.occupation")}
        text={user.occupation}
      />
      <LabelAndText
        label={t("profile:heading.education")}
        text={user.education}
      />
      <LabelAndText
        label={t("profile:heading.joined")}
        text={
          user.joined
            ? dateTimeFormatter(locale).format(timestamp2Date(user.joined))
            : ""
        }
      />
      {/* <LabelAndText
        label={t("profile:heading.local_time")}
        text={dayjs().tz(user.timezone).format("LT")}
      /> */}
    </>
  );
};
