import React from "react";
import TextBody from "../components/TextBody";
import { AuthContext, useAppContext } from "./auth/AuthProvider";

export default function Home() {
  const name = useAppContext(AuthContext).user?.name.split(" ")[0];

  return <>{name ? <TextBody>Hello, {name}.</TextBody> : null}</>;
}
