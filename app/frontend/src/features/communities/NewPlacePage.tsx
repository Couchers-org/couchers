import React from "react";

import PageTitle from "../../components/PageTitle";
import NewPlaceForm from "./NewPlaceForm";

export default function NewPlacePage() {
  return (
    <>
      <PageTitle>Create a new place</PageTitle>
      <NewPlaceForm />
    </>
  );
}
