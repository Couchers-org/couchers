import { UserDetails } from "couchers/proto/admin_pb";
import * as React from "react";

const ModUserDetailsContext = React.createContext<UserDetails.AsObject>(
  {} as UserDetails.AsObject,
);
ModUserDetailsContext.displayName = "ModUserDetailsContext";

interface ModUserDetailsProps {
  children?: React.ReactNode;
  userDetails: UserDetails.AsObject;
}

export function ModUserDetails({ children, userDetails }: ModUserDetailsProps) {
  return (
    <ModUserDetailsContext.Provider value={userDetails}>
      {children}
    </ModUserDetailsContext.Provider>
  );
}
