import PageTitle from "components/PageTitle";
import { EDIT_HOME } from "features/constants";
import HostingPreferenceForm from "features/profile/HostingPreferenceForm";
import React from "react";

export default function EditHostingPreferencePage() {
  return (
    <>
      <PageTitle>{EDIT_HOME}</PageTitle>
      <HostingPreferenceForm />
    </>
  );
}
