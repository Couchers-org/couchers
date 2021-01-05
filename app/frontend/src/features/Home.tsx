import React from "react";
import TextBody from "../components/TextBody";
import useCurrentUser from "./userQueries/useCurrentUser";

export default function Home() {
  const name = useCurrentUser().data?.name.split(" ")[0];

  return <>{name ? <TextBody>Hello, {name}.</TextBody> : null}</>;
}
