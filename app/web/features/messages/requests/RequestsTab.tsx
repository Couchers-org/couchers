import { Chip, List, styled } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import TextBody from "components/TextBody";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import { hostRequestsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { ListHostRequestsRes } from "proto/requests_pb";
import * as React from "react";
import { useState } from "react";
import { routeToHostRequest } from "routes";
import { service } from "service";
import { theme } from "theme";

const StyledWrapper = styled("div")(() => ({
  padding: theme.spacing(0, 2),
}));

const StyledList = styled(List)(() => ({
  width: "100%",
}));

const StyledListItem = styled(HostRequestListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

const StyledToggleContainer = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export default function RequestsTab({
  type,
  onlyActive,
}: {
  type: "all" | "hosting" | "surfing";
  onlyActive?: boolean;
}) {
  const { t } = useTranslation(MESSAGES);
  const [showArchived, setShowArchived] = useState(false);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({
      onlyArchived: showArchived,
      type,
    }),
    queryFn: ({ pageParam: lastRequestId }) =>
      service.requests.listHostRequests({
        lastRequestId: lastRequestId as number | undefined,
        onlyArchived: showArchived,
        type,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.lastRequestId,
    initialPageParam: undefined,
  });

  const loadMoreRequests = () => fetchNextPage();

  return (
    <StyledWrapper>
      <StyledToggleContainer>
        <Chip
          label={t("archive.archived")}
          onClick={() => setShowArchived(!showArchived)}
          color={showArchived ? "primary" : "default"}
          variant={showArchived ? "filled" : "outlined"}
        />
      </StyledToggleContainer>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <StyledList>
          {data &&
            data.pages.map((hostRequestsRes, pageNumber) =>
              pageNumber === 0 &&
              hostRequestsRes.hostRequestsList.length === 0 ? (
                <TextBody key="no-requests-text">
                  {showArchived
                    ? t("archive.no_archived_requests")
                    : t("requests_tab.no_requests_message")}
                </TextBody>
              ) : (
                <React.Fragment key={`host-requests-page-${pageNumber}`}>
                  {hostRequestsRes.hostRequestsList.map((hostRequest) => (
                    <Link
                      href={routeToHostRequest(hostRequest.hostRequestId)}
                      key={hostRequest.hostRequestId}
                    >
                      <StyledListItem
                        hostRequest={hostRequest}
                        isArchived={showArchived}
                      />
                    </Link>
                  ))}
                </React.Fragment>
              ),
            )}
          {hasNextPage && (
            <Button onClick={loadMoreRequests} loading={isFetchingNextPage}>
              {t("requests_tab.load_more_button_label")}
            </Button>
          )}
        </StyledList>
      )}
    </StyledWrapper>
  );
}
