import { Typography } from "@material-ui/core";
import Divider from "components/Divider";
import { ADDITIONAL, HOBBIES, OVERVIEW, WHO } from "features/constants";
import {
  UserAgeGenderPronouns,
  UserEducation,
  UserHomeTown,
  UserLanguages,
  UserOccupation,
  UserSinceJoined,
} from "features/user/UserDataLabels";
import { User } from "pb/api_pb";

interface AboutProps {
  user: User.AsObject;
}

export default function About({ user }: AboutProps) {
  return (
    <>
      <Typography variant="h1">{OVERVIEW}</Typography>
      <UserAgeGenderPronouns user={user} />
      <UserLanguages user={user} />
      <UserHomeTown user={user} />
      <UserOccupation user={user} />
      <UserEducation user={user} />
      <UserSinceJoined user={user} />

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
