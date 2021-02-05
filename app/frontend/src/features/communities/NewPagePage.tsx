import React from "react";

import PageTitle from "../../components/PageTitle";
import { PageType } from "../../pb/pages_pb";
import NewPageForm from "./NewPageForm";

export default function NewPagePage({ pageType }: { pageType: PageType }) {
  return (
    <>
      <PageTitle>Create a new page</PageTitle>
      <NewPageForm pageType={pageType} />
    </>
  );
}
