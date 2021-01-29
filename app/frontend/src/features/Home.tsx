import React from "react";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import {
  newPlaceRoute,
} from "../AppRoutes";
import TextBody from "../components/TextBody";
import useCurrentUser from "./userQueries/useCurrentUser";

export default function Home() {
  const name = useCurrentUser().data?.name.split(" ")[0];

  return <>
    {name ? <TextBody>Hello, {name}.</TextBody> : null}
    <Button
      component={Link}
      to={newPlaceRoute}
    >
      Create a new place
    </Button>
  </>;
}
