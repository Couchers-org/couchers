import { CircularProgress, styled } from "@mui/material";
import UserSummary from "components/UserSummary";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { ReactNode } from "react";

import Alert from "./Alert";

const ContainingDiv = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledUsersDiv = styled("div")(({ theme }) => ({
  display: "grid",
  marginBlockStart: theme.spacing(2),
  rowGap: theme.spacing(1),
}));

export interface UsersListProps {
  userIds: number[] | undefined;
  emptyListChildren?: ReactNode;
  endChildren?: ReactNode;
  error?: RpcError | null;
}

/**
 * A cute list of <UserSummary> components for each userId. Automatically fetches the user info.
 *
 * A spinner shows up while `userIds` is `undefined`. When this component is fetching the lite users, it will show skeletons (the right number).
 *
 * If any users are not found or userIds is an empty list, this will show `emptyListChildren`.
 *
 * The end of the list will show `endChildren` if the list is not empty (this is a good place to add a "load more" button)
 */
export default function UsersList({
  userIds,
  emptyListChildren,
  endChildren,
  error,
}: UsersListProps) {
  const {
    data: users,
    isLoading: isLoadingLiteUsers,
    error: usersError,
  } = useLiteUsers(userIds || []);

  // this is undefined if userIds is undefined or users hasn't loaded, otherwise it's an actual list
  const foundUserIds =
    userIds &&
    (userIds.length > 0 ? userIds?.filter((userId) => users?.has(userId)) : []);

  return (
    <ContainingDiv>
      {error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : usersError ? (
        <Alert severity="error">{usersError.message}</Alert>
      ) : !userIds ? (
        <CircularProgress />
      ) : isLoadingLiteUsers ? (
        <StyledUsersDiv>
          {userIds.map((userId) => (
            <UserSummary headlineComponent="h3" key={userId} user={undefined} />
          ))}
        </StyledUsersDiv>
      ) : foundUserIds && foundUserIds.length > 0 ? (
        <StyledUsersDiv>
          {foundUserIds.map((userId) => (
            <UserSummary
              headlineComponent="h3"
              key={userId}
              user={users?.get(userId)}
            />
          ))}
          <>{endChildren}</>
        </StyledUsersDiv>
      ) : (
        <>{emptyListChildren}</>
      )}
    </ContainingDiv>
  );
}
