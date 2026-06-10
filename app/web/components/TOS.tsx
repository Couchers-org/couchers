import { useQuery } from "@tanstack/react-query";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { tosQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { GetTermsOfServiceRes } from "proto/resources_pb";
import { service } from "service";

export default function TOS() {
  const { t } = useTranslation(GLOBAL);
  const { data, error, isLoading } = useQuery<
    GetTermsOfServiceRes.AsObject,
    RpcError
  >({
    queryKey: [tosQueryKey],
    queryFn: () => service.resources.getTermsOfService(),
  });

  if (error) {
    // Re-throw error to trigger error boundary to encourage user to report it
    // if they can't see the terms
    throw error;
  }

  return isLoading ? (
    <CenteredSpinner />
  ) : data ? (
    <>
      <HtmlMeta title={t("terms_of_service")} />
      <PageTitle>{t("terms_of_service")}</PageTitle>
      <Markdown source={data?.termsOfService} />
    </>
  ) : null;
}
