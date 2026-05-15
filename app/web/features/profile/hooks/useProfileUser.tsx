import { Profile, User } from "proto/api_pb";
import * as React from "react";

const ProfileUserContext = React.createContext<User.AsObject>(
  {} as User.AsObject,
);
ProfileUserContext.displayName = "ProfileUserContext";

const ProfileDataContext = React.createContext<Profile.AsObject>(
  {} as Profile.AsObject,
);
ProfileDataContext.displayName = "ProfileDataContext";

interface ProfileUserProviderProps {
  children?: React.ReactNode;
  user: User.AsObject;
  profile: Profile.AsObject;
}

export function ProfileUserProvider({
  children,
  user,
  profile,
}: ProfileUserProviderProps) {
  return (
    <ProfileUserContext.Provider value={user}>
      <ProfileDataContext.Provider value={profile}>
        {children}
      </ProfileDataContext.Provider>
    </ProfileUserContext.Provider>
  );
}

export function useProfileUser() {
  const profileUser = React.useContext(ProfileUserContext);
  if (profileUser === null) {
    throw new Error("No ProfileUserContext provided!");
  }
  return profileUser;
}

export function useProfileData() {
  const profileData = React.useContext(ProfileDataContext);
  if (profileData === null) {
    throw new Error("No ProfileDataContext provided!");
  }
  return profileData;
}
