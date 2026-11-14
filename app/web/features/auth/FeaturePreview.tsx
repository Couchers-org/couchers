import { Alert as MuiAlert, FormControlLabel, styled, Switch, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { useRefreshFeatureFlagAttributes } from "features/experimentation/FeatureFlagProvider";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { service } from "service";

import useAccountInfo from "./useAccountInfo";

const MarginWrapper = styled("div")(({ theme }) => ({
  margin: theme.spacing(4, 0),
}));

export default function FeaturePreview() {
  const { t } = useTranslation(AUTH);

  const { data: accountInfo, error: accountInfoError, isLoading: isAccountInfoLoading } = useAccountInfo();

  const queryClient = useQueryClient();
  const refreshFeatureFlagAttributes = useRefreshFeatureFlagAttributes();
  const {
    error: setBetaFeaturesOptInError,
    isPending: isSetBetaFeaturesOptInPending,
    mutate: setBetaFeaturesOptIn,
  } = useMutation<Empty, RpcError, boolean>({
    mutationFn: (optIn) => service.account.setBetaFeaturesOptIn(optIn),
    onSuccess: () => {
      refreshFeatureFlagAttributes();
      return queryClient.invalidateQueries({ queryKey: [accountInfoQueryKey] });
    },
  });

  return (
    <>
      <HtmlMeta title={t("feature_preview.title")} />
      <PageTitle>{t("feature_preview.title")}</PageTitle>
      <Typography
        variant="body1"
        sx={{
          marginBottom: "16px",
        }}
      >
        {t("feature_preview.explanation")}
      </Typography>
      <MuiAlert severity="warning">
        <Typography variant="inherit">{t("feature_preview.disclaimer")}</Typography>
      </MuiAlert>
      {isAccountInfoLoading ? (
        <CenteredSpinner />
      ) : accountInfoError ? (
        <MuiAlert severity="error">{accountInfoError.message}</MuiAlert>
      ) : accountInfo ? (
        <MarginWrapper>
          <Typography variant="h2">{t("feature_preview.opt_in.header")}</Typography>
          <Typography variant="body1">{t("feature_preview.opt_in.explanation")}</Typography>
          {setBetaFeaturesOptInError && <MuiAlert severity="error">{setBetaFeaturesOptInError.message}</MuiAlert>}
          <FormControlLabel
            control={
              <Switch
                checked={accountInfo.hasOptedInToBetaFeatures}
                disabled={isSetBetaFeaturesOptInPending}
                onChange={(event) => setBetaFeaturesOptIn(event.target.checked)}
              />
            }
            label={t("feature_preview.opt_in.switch_label")}
          />
        </MarginWrapper>
      ) : null}
    </>
  );
}
