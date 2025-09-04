import * as React from "react";

import { UserDetails } from "@/proto/admin_pb";

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

export function useModUserDetails() {
  const modUserDetails = React.useContext(ModUserDetailsContext);
  if (modUserDetails === null) {
    throw new Error("No ModUserDetailsContext provided!");
  }
  return modUserDetails;
}
