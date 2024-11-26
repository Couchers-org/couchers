import { CircularProgress, styled } from "@mui/material";
import UserSummary from "components/UserSummary";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { ReactNode } from "react";

const ContainingDiv = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledUsersDiv = styled("div")(({ theme }) => ({
  display: "grid",
  marginBlockStart: theme.spacing(2),
  rowGap: theme.spacing(1),
}));

export interface UsersListProps {
  userIds: number[];
  emptyListChildren?: ReactNode;
  endChildren?: ReactNode;
  isLoading?: boolean;
}

export default function UsersList({
  userIds,
  emptyListChildren,
  endChildren,
  isLoading,
}: UsersListProps) {
  const {
    data: users,
    isLoading: isUsersLoading,
    isRefetching,
  } = useLiteUsers(userIds);

  return (
    <ContainingDiv>
      {!!isLoading && isUsersLoading && !users ? (
        <CircularProgress />
      ) : userIds.length > 0 && users ? (
        <StyledUsersDiv>
          {userIds.map((userId) => {
            const user = users.get(userId);
            return user || isRefetching ? (
              <UserSummary headlineComponent="h3" key={userId} user={user} />
            ) : null;
          })}
          {endChildren}
        </StyledUsersDiv>
      ) : (
        userIds.length === 0 && { emptyListChildren }
      )}
    </ContainingDiv>
  );
}
