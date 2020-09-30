import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../reducers";

export default function Home() {
  const authToken = useSelector<RootState, string | null>(
    (state) => state.auth.authToken
  );

  return <p>Home, auth: {authToken}</p>;
}
