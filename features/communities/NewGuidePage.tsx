import HtmlMeta from "components/HtmlMeta";
import React from "react";

import PageTitle from "../../components/PageTitle";
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
