import React from "react";

import PageTitle from "../../components/PageTitle";
import NewGuideForm from "./NewGuideForm";

export default function NewGuidePage() {
  return (
    <>
      <PageTitle>Create a new guide</PageTitle>
      <NewGuideForm />
    </>
  );
}
