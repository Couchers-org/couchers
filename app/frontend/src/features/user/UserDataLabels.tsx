import LabelAndText from "components/LabelAndText";
import {
  AGE_GENDER,
  EDUCATION,
  HOMETOWN,
  JOINED,
  LANGUAGES_FLUENT,
  LAST_ACTIVE,
  OCCUPATION,
  REFERENCES,
} from "features/constants";
import { User } from "pb/api_pb";
import { dateTimeFormatter, timestamp2Date } from "utils/date";
import { timeAgo } from "utils/timeAgo";

interface Props {
  user: User.AsObject;
}

export const UserReferences = ({ user }: Props) => (
  <LabelAndText label={REFERENCES} text={`${user.numReferences || 0}`} />
);

export const UserAgeGenderPronouns = ({ user }: Props) => (
  <LabelAndText
    label={AGE_GENDER}
    text={`${user.age} / ${user.gender} ${
      user.pronouns ? `(${user.pronouns})` : ""
    }`}
  />
);

export const UserLanguages = ({ user }: Props) => (
  <LabelAndText
    label={LANGUAGES_FLUENT}
    text={user.languagesList.toString().replace(",", ", ") || "Not given"}
  />
);

export const UserHomeTown = ({ user }: Props) => (
  <LabelAndText label={HOMETOWN} text={user.hometown} />
);

export const UserOccupation = ({ user }: Props) => (
  <LabelAndText label={OCCUPATION} text={user.occupation} />
);

export const UserEducation = ({ user }: Props) => (
  <LabelAndText label={EDUCATION} text={user.education} />
);

export const UserSinceJoined = ({ user }: Props) => (
  <LabelAndText
    label={JOINED}
    text={
      user.joined ? dateTimeFormatter.format(timestamp2Date(user.joined)) : ""
    }
  />
);

export const UserLastActive = ({ user }: Props) => (
  <LabelAndText
    label={LAST_ACTIVE}
    text={
      user.lastActive ? timeAgo(timestamp2Date(user.lastActive)) : "Unknown"
    }
  />
);
