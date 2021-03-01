import PageTitle from "../../../components/PageTitle";
import { EDIT_HOME } from "../../constants";
import HostingPreferenceForm from "../HostingPreferenceForm";

export default function EditHostingPreferencePage() {
  return (
    <>
      <PageTitle>{EDIT_HOME}</PageTitle>
      <HostingPreferenceForm />
    </>
  );
}
