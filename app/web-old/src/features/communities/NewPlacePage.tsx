import HtmlMeta from "components/HtmlMeta";
import React from "react";

import PageTitle from "../../components/PageTitle";
import NewPlaceForm from "./NewPlaceForm";

export default function NewPlacePage() {
  return (
    <>
      <HtmlMeta title={"Create a new place"} />
      <PageTitle>Create a new place</PageTitle>
      <NewPlaceForm />
    </>
  );
}
