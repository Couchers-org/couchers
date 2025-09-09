import { ReactNode } from "react";

import useAccountInfo from "@/features/auth/useAccountInfo";

export interface ModVisibleComponentProps {
  children: ReactNode;
}

const ModVisibleComponent = ({ children }: ModVisibleComponentProps) => {
  const { data: accountInfo } = useAccountInfo();
  return accountInfo?.isSuperuser ? children : null;
};

export default ModVisibleComponent;
