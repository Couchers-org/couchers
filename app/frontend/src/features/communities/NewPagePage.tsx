import React from "react";

import PageTitle from "../../components/PageTitle";
import { PageType } from "../../pb/pages_pb";
import NewPageForm from "./NewPageForm";

export default function NewPagePage({ pageType }: { pageType: PageType }) {
  return (
    <>
      <PageTitle>
        Create a new {pageType === PageType.PAGE_TYPE_GUIDE ? "guide" : "place"}
      </PageTitle>
      <NewPageForm pageType={pageType} />
    </>
  );
}
