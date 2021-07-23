import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import ContributorForm from "components/ContributorForm";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { GetContributorFormInfoRes } from "proto/account_pb";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import { contributorFormInfoQueryKey } from "queryKeys";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { service } from "service";

import { ALREADY_FILLED_IN, FILL_IN_AGAIN, SUCCESS_MSG } from "./constants";

export default function StandaloneContributorForm() {
  const queryClient = useQueryClient();

  const [fillAgain, setFillAgain] = useState(false);

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery<GetContributorFormInfoRes.AsObject, Error>(
    contributorFormInfoQueryKey,
    service.account.getContributorFormInfo
  );

  const {
    error,
    isSuccess: success,
    isLoading,
    mutate,
  } = useMutation<Empty.AsObject, GrpcError, ContributorFormPb.AsObject>(
    (form) => service.account.fillContributorForm(form),
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(contributorFormInfoQueryKey);
      },
    }
  );

  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    mutate(form);
  };

  return isLoading || queryLoading ? (
    <CircularProgress />
  ) : (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      {queryError && <Alert severity="error">{queryError?.message}</Alert>}
      {data && data.filledContributorForm && !fillAgain ? (
        <>
          <Typography variant="body1">{ALREADY_FILLED_IN}</Typography>
          <Button onClick={() => setFillAgain(true)}>{FILL_IN_AGAIN}</Button>
        </>
      ) : success ? (
        <>
          <Typography variant="body1">{SUCCESS_MSG}</Typography>
        </>
      ) : (
        <ContributorForm processForm={handleSubmit} autofocus />
      )}
    </>
  );
}
