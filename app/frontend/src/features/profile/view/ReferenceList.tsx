import { List, makeStyles } from "@material-ui/core";
import useUsers from "features/userQueries/useUsers";
import { ListReferencesRes } from "pb/references_pb";

import ReferenceListItem from "./ReferenceListItem";

const useStyles = makeStyles((theme) => ({
  referencesList: {
    "& > *": {
      paddingBlockEnd: theme.spacing(3),
    },
    width: "100%",
  },
}));

interface ReferenceListProps {
  isReceived?: boolean;
  referencePages: ListReferencesRes.AsObject[];
  referenceUsers: ReturnType<typeof useUsers>["data"];
}

export default function ReferenceList({
  isReceived,
  referencePages,
  referenceUsers,
}: ReferenceListProps) {
  const classes = useStyles();

  return (
    <List className={classes.referencesList}>
      {referencePages
        .map((page) =>
          page.referencesList.map((reference) => {
            const userToShow = referenceUsers?.get(
              isReceived ? reference.fromUserId : reference.toUserId
            );
            return userToShow ? (
              <ReferenceListItem
                key={reference.referenceId}
                isReceived
                user={userToShow}
                reference={reference}
              />
            ) : null;
          })
        )
        .flat()}
    </List>
  );
}
