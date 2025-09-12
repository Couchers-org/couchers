import React from "react";

import HtmlMeta from "@/components/HtmlMeta";
import PageTitle from "@/components/PageTitle";

import NewPlaceForm from "./NewPlaceForm";

const NewPlacePage = () => {
  return (
    <>
      <HtmlMeta title={"Create a new place"} />
      <PageTitle>Create a new place</PageTitle>
      <NewPlaceForm />
    </>
  );
};

export default NewPlacePage;
