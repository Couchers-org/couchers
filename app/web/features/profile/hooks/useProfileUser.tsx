import * as React from "react";

import { User } from "@/proto/api_pb";

// eslint-disable-next-line @typescript-eslint/naming-convention
const ProfileUserContext = React.createContext<User.AsObject>(
  {} as User.AsObject,
);
ProfileUserContext.displayName = "ProfileUserContext";

interface ProfileUserProviderProps {
  children?: React.ReactNode;
  user: User.AsObject;
}

export const ProfileUserProvider = ({
  children,
  user,
}: ProfileUserProviderProps) => {
  return (
    <ProfileUserContext.Provider value={user}>
      {children}
    </ProfileUserContext.Provider>
  );
};

const useProfileUser = () => {
  return React.useContext(ProfileUserContext);
};

export default useProfileUser;
