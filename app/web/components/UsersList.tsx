import { CircularProgress, styled } from "@mui/material";
import UserSummary from "components/UserSummary";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { LiteUser } from "proto/api_pb";
import { ReactNode } from "react";

import Alert from "./Alert";
import { EllipsisMenuItem } from "./EllipsisMenu";

const ContainingDiv = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledUsersDiv = styled("div", {
  shouldForwardProp: (prop) => prop !== "layout",
})<{ layout?: "list" | "grid" }>(({ theme, layout = "list" }) => ({
  marginBlockStart: theme.spacing(2),
  display: "grid",
  gap: theme.spacing(1),
  ...(layout === "grid" && {
    gridAutoRows: "6rem",
    [theme.breakpoints.up("sm")]: {
      gridAutoRows: "5.5rem",
      gridTemplateColumns: "repeat(auto-fit, minmax(19.5rem, 1fr))",
    },
  }),
}));

interface UsersListProps {
  userIds: number[] | undefined;
  emptyListChildren?: ReactNode;
  endChildren?: ReactNode;
  error?: RpcError | null;
  titleIsLink?: boolean;
  layout?: "list" | "grid";
  getUserMenuItems?: (user: LiteUser.AsObject) => EllipsisMenuItem[] | undefined;
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
  titleIsLink = false,
  layout = "list",
  getUserMenuItems,
}: UsersListProps) {
  const { data: users, isLoading: isLoadingLiteUsers, error: usersError } = useLiteUsers(userIds);

  // this is undefined if userIds is undefined or users hasn't loaded, otherwise it's an actual list
  const foundUsers =
    userIds && (userIds.length > 0 ? userIds.map((userId) => users?.get(userId)).filter((user) => !!user) : []);

  const inner = () => {
    if (error) {
      return <Alert severity="error">{error.message}</Alert>;
    } else if (usersError) {
      return <Alert severity="error">{usersError.message}</Alert>;
    } else if (!userIds) {
      return <CircularProgress />;
    } else if (isLoadingLiteUsers) {
      return (
        <StyledUsersDiv layout={layout}>
          {userIds.map((userId) => (
            <UserSummary headlineComponent="h3" key={userId} user={undefined} />
          ))}
        </StyledUsersDiv>
      );
    } else if (foundUsers && foundUsers.length > 0) {
      return (
        <StyledUsersDiv layout={layout}>
          {foundUsers.map((user) => {
            return (
              <UserSummary
                headlineComponent="h3"
                key={user.userId}
                user={user}
                titleIsLink={titleIsLink}
                menuItems={getUserMenuItems?.(user)}
              />
            );
          })}
          <>{endChildren}</>
        </StyledUsersDiv>
      );
    } else {
      return <>{emptyListChildren}</>;
    }
  };

  return <ContainingDiv>{inner()}</ContainingDiv>;
}
