import { Card, Typography, styled } from "@mui/material";
import { RpcError } from "grpc-web";

import Button from "@/components/Button";
import { EllipsisMenuItem } from "@/components/EllipsisMenu";
import UsersList from "@/components/UsersList";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { LiteUser } from "@/proto/api_pb";
import { theme } from "@/theme";

const StyledWrapper = styled(Card)(() => ({
  padding: theme.spacing(2),
}));

const StyledSeeAllButton = styled(Button)(() => ({
  justifySelf: "center",
}));

export interface EventUsersProps {
  emptyState: string;
  error: RpcError | null;
  hasNextPage?: boolean;
  onSeeAllClick?(): void;
  userIds: number[] | undefined;
  title: string;
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
          hasNextPage && (
            <StyledSeeAllButton onClick={onSeeAllClick}>
              {t("communities:see_all")}
            </StyledSeeAllButton>
          )
        }
        emptyListChildren={
          <Typography variant="body1">{emptyState}</Typography>
        }
        getUserMenuItems={getUserMenuItems}
      />
    </StyledWrapper>
  );
}
