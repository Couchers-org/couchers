import { Box, styled } from "@mui/material";
import { User } from "proto/api_pb";
import SearchResultUserCard from "./SeachResultUserCard";

interface SearchResultsListProps {
  selectedUserId: number | undefined;
  users: User.AsObject[] | undefined;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: "100%",
}));

const StyledCardWrapper = styled(Box)(({ theme }) => ({
  flex: `1 1 calc(50% - ${theme.spacing(2)})`, // 2 columns by default
}));

const SearchResultsList = ({
  selectedUserId,
  users,
}: SearchResultsListProps) => {
  if (!users) {
    return null;
  }

  const selectedUser = users.find((user) => user.userId === selectedUserId);

  return (
    <StyledContainer>
      {selectedUserId && (
        <StyledCardWrapper key={selectedUser?.userId}>
          <SearchResultUserCard
            isHighlighted={selectedUserId === selectedUser?.userId}
            user={selectedUser!}
          />
        </StyledCardWrapper>
      )}
      {!selectedUserId &&
        users.map((user) => (
          <StyledCardWrapper key={user.userId}>
            <SearchResultUserCard
              isHighlighted={selectedUserId === user.userId}
              user={user}
            />
          </StyledCardWrapper>
        ))}
    </StyledContainer>
  );
};

export default SearchResultsList;
