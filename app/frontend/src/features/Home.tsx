import Button from "components/Button";
import TextBody from "components/TextBody";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React from "react";
import { Link } from "react-router-dom";
import { newGuideRoute, newPlaceRoute } from "routes";

export default function Home() {
  const name = useCurrentUser().data?.name.split(" ")[0];

  return (
    <>
      {name ? <TextBody>Hello, {name}.</TextBody> : null}
      <Button component={Link} to={newPlaceRoute}>
        Create a new place
      </Button>
      <Button component={Link} to={newGuideRoute}>
        Create a new guide
      </Button>
    </>
  );
}
