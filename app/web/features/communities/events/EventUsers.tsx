import { Card, styled, Typography } from "@mui/material";
import Button from "components/Button";
import CursorPagination from "components/CursorPagination";
import { EllipsisMenuItem } from "components/EllipsisMenu";
import UsersList from "components/UsersList";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { ListEventAttendeesRes } from "proto/events_pb";
import { theme } from "theme";

const StyledWrapper = styled(Card)(() => ({
  padding: theme.spacing(2),
}));

const StyledSeeAllButton = styled(Button)(() => ({
  justifySelf: "center",
}));

const PaginationWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export interface EventUsersProps {
  emptyState: string;
  error: RpcError | null;
  hasNextPage?: boolean;
  onSeeAllClick?(): void;
  userIds: number[] | undefined;
  title: string;
  layout?: "list" | "grid";
  isLoading?: boolean;
  pagination?: {
    pageNumber: number;
    currentPage: ListEventAttendeesRes.AsObject | undefined;
    handlePreviousPageClick: () => void;
    handleNextPageClick: () => void;
  };
  getUserMenuItems?: (
    user: LiteUser.AsObject,
  ) => EllipsisMenuItem[] | undefined;
}

export default function EventUsers({
  emptyState,
  error,
  hasNextPage,
  onSeeAllClick,
  userIds,
  title,
  layout = "list",
  isLoading,
  pagination,
  getUserMenuItems,
}: EventUsersProps) {
  const { t } = useTranslation([COMMUNITIES]);

  return (
    <StyledWrapper>
      <Typography variant="h2">{title}</Typography>
      <UsersList
        error={error}
        userIds={userIds}
        endChildren={
          hasNextPage && !pagination ? (
            <StyledSeeAllButton onClick={onSeeAllClick}>
              {t("communities:see_all")}
            </StyledSeeAllButton>
          ) : null
        }
        emptyListChildren={
          <Typography variant="body1">{emptyState}</Typography>
        }
        getUserMenuItems={getUserMenuItems}
        layout={layout}
      />
      {pagination ? (
        <PaginationWrapper>
          <CursorPagination
            hasNextPage={Boolean(pagination.currentPage?.nextPageToken)}
            onNext={pagination.handleNextPageClick}
            hasPreviousPage={pagination.pageNumber > 1}
            onPrevious={pagination.handlePreviousPageClick}
            isLoading={isLoading}
          />
        </PaginationWrapper>
      ) : null}
    </StyledWrapper>
  );
}
