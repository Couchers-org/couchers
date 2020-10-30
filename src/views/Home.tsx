import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../reducers";

export default function Home() {
  const name = useSelector<RootState, string | undefined>(
    (state) => state.auth.user?.name.split(" ")[0]
  );

  return name ? <p>Hello, {name}.</p> : null;
}
