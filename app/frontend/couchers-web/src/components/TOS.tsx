import { CircularProgress } from "@material-ui/core";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { GetTermsOfServiceRes } from "couchers-core/src/proto/resources_pb";
import { service } from "couchers-core/dist/service";
import { TERMS_OF_SERVICE } from "features/auth/constants";
import { Error as GrpcError } from "grpc-web";
import { tosQueryKey } from "queryKeys";
import { useQuery } from "react-query";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: theme.breakpoints.values.lg,
    margin: "0 auto",
    padding: theme.spacing(2),
  },
}));

export default function TOS() {
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
      <PageTitle>{TERMS_OF_SERVICE}</PageTitle>
      <Markdown source={data?.termsOfService} />
    </div>
  ) : null;
}
