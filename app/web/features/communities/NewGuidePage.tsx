import React from "react";

import HtmlMeta from "@/components/HtmlMeta";
import PageTitle from "@/components/PageTitle";

import NewGuideForm from "./NewGuideForm";

const NewGuidePage = () => {
  return (
    <>
      <HtmlMeta title={"Create a new guide"} />
      <PageTitle>Create a new guide</PageTitle>
      <NewGuideForm />
    </>
  );
};

export default NewGuidePage;
