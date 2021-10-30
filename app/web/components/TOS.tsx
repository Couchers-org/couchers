import { CircularProgress } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { Error as GrpcError } from "grpc-web";
import { GetTermsOfServiceRes } from "proto/resources_pb";
import { tosQueryKey } from "queryKeys";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: theme.breakpoints.values.lg,
    margin: "0 auto",
    padding: theme.spacing(2),
  },
}));

export default function TOS() {
  const { t } = useTranslation("global");
  const classes = useStyles();
  const { data, error, isLoading } = useQuery<
    GetTermsOfServiceRes.AsObject,
    GrpcError
  >({
    queryKey: tosQueryKey,
    queryFn: () => service.resources.getTermsOfService(),
  });

  if (error) {
    // Re-throw error to trigger error boundary to encourage user to report it
    // if they can't see the terms
    throw error;
  }

  return isLoading ? (
    <CircularProgress />
  ) : data ? (
    <div className={classes.root}>
      <HtmlMeta title={t("terms_of_service")} />
      <PageTitle>{t("terms_of_service")}</PageTitle>
      <Markdown source={data?.termsOfService} />
    </div>
  ) : null;
}
