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

export const ReferencesLastActiveLabels = ({ user }: Props) => (
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
    <>
      <LabelAndText label={t("response_rate_label")} text={rateText ?? ""} />
      {timeText && (
        <LabelAndText label={t("response_time_label")} text={timeText} />
      )}
    </>
  );
};

export const AgeGenderLanguagesLabels = ({ user }: Props) => {
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
