import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import React from "react";

import NewGuideForm from "./NewGuideForm";

export default function NewGuidePage() {
  return (
    <>
      <HtmlMeta title={"Create a new guide"} />
      <PageTitle>Create a new guide</PageTitle>
      <NewGuideForm />
    </>
  );
}
