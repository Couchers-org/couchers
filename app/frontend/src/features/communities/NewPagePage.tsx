import React from "react";
import PageTitle from "../../components/PageTitle";
import NewPageForm from "./NewPageForm"
import { PageType } from "../../pb/pages_pb"

export default function NewPagePage({pageType}: {pageType: PageType}) {
  return (
    <>
      <PageTitle>Create a new page</PageTitle>
      <NewPageForm pageType={pageType} />
    </>
  );
}
