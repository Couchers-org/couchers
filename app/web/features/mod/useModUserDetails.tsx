import { UserDetails } from "@couchers/services/admin";
import * as React from "react";

// eslint-disable-next-line @typescript-eslint/naming-convention
const ModUserDetailsContext = React.createContext<UserDetails.AsObject>(
  {} as UserDetails.AsObject,
);
ModUserDetailsContext.displayName = "ModUserDetailsContext";

interface ModUserDetailsProps {
  children?: React.ReactNode;
  userDetails: UserDetails.AsObject;
}

export const ModUserDetails = ({
  children,
  userDetails,
}: ModUserDetailsProps) => {
  return (
    <ModUserDetailsContext.Provider value={userDetails}>
      {children}
    </ModUserDetailsContext.Provider>
  );
};

export const useModUserDetails = () => {
  return React.useContext(ModUserDetailsContext);
};
