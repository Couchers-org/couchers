import React from "react";
import TextBody from "../components/TextBody";
import { useAuthContext } from "./auth/AuthProvider";

export default function Home() {
  const name = useAuthContext().authState.user?.name.split(" ")[0];

  return <>{name ? <TextBody>Hello, {name}.</TextBody> : null}</>;
}
