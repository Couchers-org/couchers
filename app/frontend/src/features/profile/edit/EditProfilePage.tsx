import PageTitle from "components/PageTitle";
import { EDIT_PROFILE } from "features/constants";
import ProfileForm from "features/profile/edit/ProfileForm";
import React from "react";

export default function EditProfilePage() {
  return (
    <>
      <PageTitle>{EDIT_PROFILE}</PageTitle>
      <ProfileForm />
    </>
  );
}
