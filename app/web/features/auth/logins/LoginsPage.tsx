import { CircularProgress, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button, { AppButtonProps } from "components/Button";
import { activeLoginsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { ListActiveSessionsRes } from "proto/account_pb";
import { useInfiniteQuery, useMutation, useQueryClient } from "react-query";
import { service } from "service";
import { timestamp2Date } from "utils/date";

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

const StyledButton = styled(Button)<AppButtonProps>(({ theme }) => ({
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
  } = useInfiniteQuery<ListActiveSessionsRes.AsObject, RpcError>({
    queryKey: activeLoginsKey,
    queryFn: ({ pageParam }) => service.account.listActiveSessions(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  const sessions = data?.pages.flatMap((page) => page.activeSessionsList) || [];

  const {
    error: logoutAllError,
    isLoading: logoutAllIsLoading,
    mutate: logoutAll,
  } = useMutation<void, RpcError>(
    async () => {
      await service.account.logOutOtherSessions(true);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(activeLoginsKey);
      },
    }
  );

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
        <CircularProgress />
      ) : (
        sessions.map((session) => (
          <LoginCard
            key={timestamp2Date(session.created!).toString()}
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
