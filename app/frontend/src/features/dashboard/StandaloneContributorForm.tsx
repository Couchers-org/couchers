import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import ContributorForm from "components/ContributorForm";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import { useMutation } from "react-query";
import { service } from "service";

export default function DashboardContributorForm() {
  const { error, isLoading, mutate } = useMutation<
    Empty.AsObject,
    GrpcError,
    ContributorFormPb.AsObject
  >((data) => service.account.fillContributorForm(data));

  const handleSubmit = async (data: ContributorFormPb.AsObject) => {
    mutate(data);
  };

  return isLoading ? (
    <CircularProgress />
  ) : (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      <ContributorForm processForm={handleSubmit} autofocus />
    </>
  );
}
