import { ButtonProps, styled, Typography } from "@mui/material";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { ListActiveSessionsRes } from "couchers/proto/account_pb";
import { activeLoginsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { service } from "service";
import { timestampToInstant } from "utils/date";

import LoginCard from "./LoginCard";

const StyledLoginsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(4),
  margin: "0 auto",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    width: "50%",
  },
}));

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export default function LoginsPage() {
  const { t } = useTranslation([GLOBAL, AUTH]);
  const queryClient = useQueryClient();

  const {
    isLoading,
    error,
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    ListActiveSessionsRes.AsObject,
    RpcError,
    InfiniteData<ListActiveSessionsRes.AsObject>,
    [typeof activeLoginsKey],
    string
  >({
    queryKey: [activeLoginsKey],
    queryFn: ({ pageParam }) => service.account.listActiveSessions(pageParam),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  const sessions = data?.pages.flatMap((page) => page.activeSessionsList) || [];

  const {
    error: logoutAllError,
    isPending: logoutAllIsLoading,
    mutate: logoutAll,
  } = useMutation({
    mutationFn: async () => {
      await service.account.logOutOtherSessions(true);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [activeLoginsKey],
      });
    },
  });

  return (
    <StyledLoginsContainer>
      <Typography variant="h1" gutterBottom>
        {t("auth:active_logins.heading")}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {t("auth:active_logins.description")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {logoutAllError && (
        <Alert severity="error">{logoutAllError?.message}</Alert>
      )}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        sessions.map((session) => (
          <LoginCard
            key={timestampToInstant(session.created!).toString()}
            session={session}
          />
        ))
      )}
      {hasNextPage && (
        <StyledButton
          loading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {t("global:load_more")}
        </StyledButton>
      )}
      <StyledButton
        color="secondary"
        loading={logoutAllIsLoading}
        onClick={() => logoutAll()}
      >
        {t("auth:active_logins.log_out_of_all_session")}
      </StyledButton>
    </StyledLoginsContainer>
  );
}
