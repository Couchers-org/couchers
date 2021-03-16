import { makeStyles } from "@material-ui/core";
import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import React from "react";

const useStyles = makeStyles((theme) => ({
  disabledButton: {
    backgroundColor: theme.palette.grey[100],
  },
  editButton: {
    marginBottom: theme.spacing(2),
  },
}));

// interface RequestButtonProps {
// isPending: boolean;
// setMutationError: SetMutationError;
// userId: number;
// }

export default function RequestButton() {
  // {
  // isPending,
  // setMutationError,
  // userId,
  // }: RequestButtonProps) {

  // const { isLoading, mutate: sendRequest } = useMutation<
  //   Empty,
  //   Error,
  //   RequestButtonProps
  // >(({ userId }) => service.api.createHostRequest(userId), {
  //   onError: (error, { setMutationError }) => {
  //     setMutationError(error.message);
  //   },
  //   onMutate: ({ setMutationError }) => {
  //     setMutationError("");
  //   },
  //   onSuccess: (_, { userId }) => {
  //     queryClient.invalidateQueries(["user", userId]);
  //   },
  // });

  return (
    <Button
      startIcon={<PersonAddIcon />}
      // className={isPending ? classes.disabledButton : classes.editButton}
      // disabled={isPending}
      // onClick={() => {
      //   if (!isPending) {
      //     sendRequest({ setMutationError, userId, isPending });
      //   }
      // }}
      // loading={isLoading}
    >
      {/* {isPending ? PENDING : ADD_FRIEND} */}
    </Button>
  );
}
