import LabelAndText from "components/LabelAndText";
import {
  AGE_GENDER,
  EDUCATION,
  HOMETOWN,
  JOINED,
  LANGUAGES_FLUENT,
  LAST_ACTIVE,
  LOCAL_TIME,
  OCCUPATION,
  REFERENCES,
} from "features/constants";
import {
  LANGUAGES_FLUENT_FALSE,
  LAST_ACTIVE_FALSE,
} from "features/profile/constants";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { User } from "proto/api_pb";
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

export const RemainingAboutLabels = ({ user }: Props) => (
  <>
    <LabelAndText label={HOMETOWN} text={user.hometown} />
    <LabelAndText label={OCCUPATION} text={user.occupation} />
    <LabelAndText label={EDUCATION} text={user.education} />
    <LabelAndText
      label={JOINED}
      text={
        user.joined ? dateTimeFormatter.format(timestamp2Date(user.joined)) : ""
      }
    />
    <LabelAndText
      label={LOCAL_TIME}
      text={dayjs().tz(user.timezone).format("LT")}
    />
  </>
);
