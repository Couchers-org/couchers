import useAccountInfo from "features/auth/useAccountInfo";
import { ReactNode } from "react";

interface ModVisibleComponentProps {
  children: ReactNode;
}

export default function ModVisibleComponent({ children }: ModVisibleComponentProps) {
  const { data: accountInfo } = useAccountInfo();
  return accountInfo?.isSuperuser ? children : null;
}
