import { ListReferencesRes } from "@couchers/services/references";
import { List, styled } from "@mui/material";

import { useLiteUsers } from "@/features/userQueries/useLiteUsers";

import ReferenceListItem from "./ReferenceListItem";

interface ReferenceListProps {
  isReceived?: boolean;
  referencePages: ListReferencesRes.AsObject[];
  referenceUsers: ReturnType<typeof useLiteUsers>["data"];
}

const ReferencesList = styled(List)(({ theme }) => ({
  "& > *": {
    paddingBlockEnd: theme.spacing(3),
  },
  width: "100%",
  overflow: "hidden",
}));

const ReferenceList = ({
  isReceived,
  referencePages,
  referenceUsers,
}: ReferenceListProps) => {
  return (
    <ReferencesList>
      {referencePages
        .map((page) =>
          page.referencesList.map((reference) => {
            const userToShow = referenceUsers?.get(
              isReceived ? reference.fromUserId : reference.toUserId,
            );
            return userToShow ? (
              <ReferenceListItem
                key={reference.referenceId}
                isReceived
                user={userToShow}
                reference={reference}
              />
            ) : null;
          }),
        )
        .flat()}
    </ReferencesList>
  );
};

export default ReferenceList;
