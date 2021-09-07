import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import ContributorForm from "components/ContributorForm";
import { GetContributorFormInfoRes } from "proto/account_pb";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import { contributorFormInfoQueryKey } from "queryKeys";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { service } from "service";

import { ALREADY_FILLED_IN, FILL_IN_AGAIN, SUCCESS_MSG } from "./constants";

export default function StandaloneContributorForm() {
  const queryClient = useQueryClient();

  const [fillState, setFillState] = useState<
    undefined | "success" | "fillAgain"
  >(undefined);

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery<GetContributorFormInfoRes.AsObject, Error>(
    contributorFormInfoQueryKey,
    service.account.getContributorFormInfo
  );

  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    await service.account.fillContributorForm(form);
    queryClient.invalidateQueries(contributorFormInfoQueryKey);
    setFillState("success");
  };

  return queryLoading ? (
    <CircularProgress />
  ) : (
    <>
      {queryError && <Alert severity="error">{queryError?.message}</Alert>}
      {data?.filledContributorForm && fillState !== "fillAgain" ? (
        <>
          <Typography variant="body1" paragraph>
            {ALREADY_FILLED_IN}
          </Typography>
          <Button onClick={() => setFillState("fillAgain")}>
            {FILL_IN_AGAIN}
          </Button>
        </>
      ) : fillState === "success" ? (
        <Typography variant="body1">{SUCCESS_MSG}</Typography>
      ) : (
        <ContributorForm processForm={handleSubmit} autofocus />
      )}
    </>
  );
}
