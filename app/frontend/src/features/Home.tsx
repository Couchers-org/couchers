import React from "react";
import { useSelector } from "react-redux";
import TextBody from '../components/TextBody';
import { RootState } from "../reducers";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import {
  newPageRoute,
} from "../AppRoutes";

export default function Home() {
  const name = useSelector<RootState, string | undefined>(
    (state) => state.auth.user?.name.split(" ")[0]
  );

  return <>
    {name ? <TextBody>Hello, {name}.</TextBody> : null}
    <Button
      component={Link}
      to={newPageRoute}
    >
      Create a new page
    </Button>
  </>;
}
