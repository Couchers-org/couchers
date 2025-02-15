import { Box, styled } from "@mui/material";
import { User } from "proto/api_pb";

import SearchResultUserCard from "./SeachResultUserCard";

interface SearchResultsListProps {
  selectedUserIds: User.AsObject["userId"][];
  users: User.AsObject[] | undefined;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: "100%",
  height: "100%",
}));

const StyledCardWrapper = styled(Box)(({ theme }) => ({
  flex: `1 1 calc(50% - ${theme.spacing(2)})`, // 2 columns by default
}));

const SearchResultsList = ({
  selectedUserIds,
  users,
}: SearchResultsListProps) => {
  if (!users) {
    return null;
  }

  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.userId),
  );

  return (
    <StyledContainer>
      {selectedUserIds.length > 0 &&
        selectedUsers.map((selectedUser) => (
          <StyledCardWrapper key={selectedUser?.userId}>
            <SearchResultUserCard isHighlighted user={selectedUser} />
          </StyledCardWrapper>
        ))}
      {selectedUserIds.length < 1 &&
        users.map((user) => (
          <StyledCardWrapper key={user.userId}>
            <SearchResultUserCard isHighlighted={false} user={user} />
          </StyledCardWrapper>
        ))}
    </StyledContainer>
  );
};

export default SearchResultsList;
