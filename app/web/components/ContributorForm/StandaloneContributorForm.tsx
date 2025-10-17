import { GetContributorFormInfoRes } from "@couchers/services/account";
import { ContributorForm as ContributorFormPb } from "@couchers/services/auth";
import { Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import ContributorForm from "@/components/ContributorForm";
import { CONTRIBUTOR_FORM_INFO_QUERY_KEY } from "@/features/queryKeys";
import { service } from "@/service";

import { ALREADY_FILLED_IN, FILL_IN_AGAIN, SUCCESS_MSG } from "./constants";

const StandaloneContributorForm = () => {
  const queryClient = useQueryClient();

  const [fillState, setFillState] = useState<
    undefined | "success" | "fillAgain"
  >(undefined);

  const {
    data,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery<GetContributorFormInfoRes.AsObject>({
    queryKey: [CONTRIBUTOR_FORM_INFO_QUERY_KEY],
    queryFn: service.account.getContributorFormInfo,
  });

  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    await service.account.fillContributorForm(form);
    await queryClient.invalidateQueries({
      queryKey: [CONTRIBUTOR_FORM_INFO_QUERY_KEY],
    });
    setFillState("success");
  };

  return isQueryLoading ? (
    <CenteredSpinner />
  ) : (
    <>
      {queryError && <Alert severity="error">{queryError.message}</Alert>}
      {data?.filledContributorForm && fillState !== "fillAgain" ? (
        <>
          <Typography
            variant="body1"
            sx={{
              marginBottom: "16px",
            }}
          >
            {ALREADY_FILLED_IN}
          </Typography>
          <Button
            onClick={() => {
              setFillState("fillAgain");
            }}
          >
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
};

export default StandaloneContributorForm;
