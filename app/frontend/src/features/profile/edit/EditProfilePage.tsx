import PageTitle from "../../../components/PageTitle";
import { EDIT_PROFILE } from "../../constants";
import ProfileForm from "./ProfileForm";

export default function EditProfilePage() {
  return (
    <>
      <PageTitle>{EDIT_PROFILE}</PageTitle>
      <ProfileForm />
    </>
  );
}
