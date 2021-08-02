import ContributorForm from "components/ContributorForm";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import React from "react";

export default function SSRTestForm() {
  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    console.log(form);
  };

  return <ContributorForm processForm={handleSubmit} autofocus />;
}
