import CircularProgress from "components/CircularProgress";
import LabelAndText from "components/LabelAndText";
import {
  AGE_GENDER,
  EDUCATION,
  HOMETOWN,
  JOINED,
  LANGUAGES_FLUENT,
  LANGUAGES_FLUENT_FALSE,
  LAST_ACTIVE,
  LAST_ACTIVE_FALSE,
  LOCAL_TIME,
  OCCUPATION,
  REFERENCES,
} from "features/profile/constants";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { responseRateKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { ResponseRate } from "proto/requests_pb";
import { useQuery } from "react-query";
import { service } from "service";
import { dateTimeFormatter, timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import { hourMillis, lessThanHour, timeAgo } from "utils/timeAgo";

interface Props {
  user: User.AsObject;
}

export const LabelsReferencesLastActive = ({ user }: Props) => (
  <>
    <LabelAndText label={REFERENCES} text={`${user.numReferences || 0}`} />
    <LabelAndText
      label={LAST_ACTIVE}
      text={
        user.lastActive
          ? timeAgo(timestamp2Date(user.lastActive), {
              millis: hourMillis,
              text: lessThanHour,
            })
          : LAST_ACTIVE_FALSE
      }
    />
  </>
);

export const LabelsResponseRate = ({ user }: Props) => {
  const { t } = useTranslation("profile");
  const query = useQuery(responseRateKey(user.userId), () =>
    service.requests.getResponseRate(user.userId)
  );
  const rateText =
    query.data?.responseRate === ResponseRate.RESPONSE_RATE_INSUFFICIENT_DATA
      ? t("response_rate_text_insufficient")
      : query.data?.responseRate === ResponseRate.RESPONSE_RATE_LOW
      ? t("response_rate_text_low")
      : query.data?.responseRate === ResponseRate.RESPONSE_RATE_SOME
      ? t("response_rate_text_some")
      : query.data?.responseRate === ResponseRate.RESPONSE_RATE_MOST
      ? t("response_rate_text_most")
      : query.data?.responseRate === ResponseRate.RESPONSE_RATE_ALMOST_ALL
      ? t("response_rate_text_almost_all")
      : undefined;
  const timeText =
    query.data?.responseRate === ResponseRate.RESPONSE_RATE_SOME
      ? t("response_time_text_some", {
          p33: dayjs
            .duration(query.data.responseTimeP33!.seconds, "second")
            .humanize(),
        })
      : query.data?.responseRate === ResponseRate.RESPONSE_RATE_MOST
      ? t("response_time_text_most", {
          p33: dayjs
            .duration(query.data.responseTimeP33!.seconds, "second")
            .humanize(),
          p66: dayjs
            .duration(query.data.responseTimeP66!.seconds, "second")
            .humanize(),
        })
      : query.data?.responseRate === ResponseRate.RESPONSE_RATE_ALMOST_ALL
      ? t("response_time_text_almost_all", {
          p33: dayjs
            .duration(query.data.responseTimeP33!.seconds, "second")
            .humanize(),
          p66: dayjs
            .duration(query.data.responseTimeP66!.seconds, "second")
            .humanize(),
        })
      : undefined;

  return (
    <>
      <LabelAndText label={t("response_rate_label")} text={rateText ?? ""} />
      {timeText && (
        <LabelAndText label={t("response_time_label")} text={timeText} />
      )}
    </>
  );
};

export const LabelsAgeGenderLanguages = ({ user }: Props) => {
  const { languages } = useLanguages();

  return (
    <>
      <LabelAndText
        label={AGE_GENDER}
        text={`${user.age} / ${user.gender} ${
          user.pronouns ? `(${user.pronouns})` : ""
        }`}
      />
      {languages && (
        <LabelAndText
          label={LANGUAGES_FLUENT}
          text={
            user.languageAbilitiesList
              .map((ability) => languages[ability.code])
              .join(", ") || LANGUAGES_FLUENT_FALSE
          }
        />
      )}
    </>
  );
};

export const RemainingAboutLabels = ({ user }: Props) => {
  const {
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);
  return (
    <>
      <LabelAndText label={HOMETOWN} text={user.hometown} />
      <LabelAndText label={OCCUPATION} text={user.occupation} />
      <LabelAndText label={EDUCATION} text={user.education} />
      <LabelAndText
        label={JOINED}
        text={
          user.joined
            ? dateTimeFormatter(locale).format(timestamp2Date(user.joined))
            : ""
        }
      />
      <LabelAndText
        label={LOCAL_TIME}
        text={dayjs().tz(user.timezone).format("LT")}
      />
    </>
  );
};
