import { Typography } from "@material-ui/core";

import Divider from "../../../components/Divider";
import LabelAndText from "../../../components/LabelAndText";
import { User } from "../../../pb/api_pb";
import { dateTimeFormatter, timestamp2Date } from "../../../utils/date";
import {
  ADDITIONAL,
  AGE_GENDER,
  EDUCATION,
  HOBBIES,
  HOMETOWN,
  JOINED,
  LANGUAGES_FLUENT,
  OCCUPATION,
  OVERVIEW,
  WHO,
} from "../../constants";

interface AboutProps {
  user: User.AsObject;
}

export default function About({ user }: AboutProps) {
  return (
    <>
      <Typography variant="h1">{OVERVIEW}</Typography>
      <LabelAndText
        label={AGE_GENDER}
        text={`${user.age} / ${user.gender} (${user.pronouns})`}
      />
      <LabelAndText
        label={LANGUAGES_FLUENT}
        text={user.languagesList.toString()}
      />
      <LabelAndText label={HOMETOWN} text={user.hometown} />
      <LabelAndText label={OCCUPATION} text={user.occupation} />
      <LabelAndText label={EDUCATION} text={user.education} />
      <LabelAndText
        label={JOINED}
        text={
          user.joined
            ? dateTimeFormatter.format(timestamp2Date(user.joined))
            : ""
        }
      />
      <Divider />
      <Typography variant="h1">{WHO}</Typography>
      <Typography variant="body1">{user.aboutMe}</Typography>
      <Divider />
      <Typography variant="h1">{HOBBIES}</Typography>
      <Typography variant="body1">{user.thingsILike}</Typography>
      <Divider />
      <Typography variant="h1">{ADDITIONAL}</Typography>
      <Typography variant="body1">{user.additionalInformation}</Typography>
    </>
  );
}
