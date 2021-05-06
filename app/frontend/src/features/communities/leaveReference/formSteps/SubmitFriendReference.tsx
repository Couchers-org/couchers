import { Typography } from "@material-ui/core";
import Button from "components/Button";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import {
  FURTHER,
  REFERENCE_CONFIRM,
  REFERENCE_SUBMIT_HEADING,
  THANK_YOU,
} from "features/communities/constants";
import { useData } from "features/communities/leaveReference/ReferenceDataContext";
import { User } from "pb/api_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { writeFriendRequestReference } from "service/references";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function SubmitFriendReference({ user }: ReferenceFormProps) {
  const { data } = useData()!;
  const { handleSubmit } = useForm<typeof data>();

  const onSubmit = async () => {
    if (data.wasAppropriate === "true") {
      await writeFriendRequestReference({
        toUserId: user.userId,
        text: data.text,
        wasAppropriate: true,
        rating: data.rating,
      });
    } else if (data.wasAppropriate === "false") {
      await writeFriendRequestReference({
        toUserId: user.userId,
        text: data.text,
        wasAppropriate: false,
        rating: data.rating,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h1">{REFERENCE_SUBMIT_HEADING}</Typography>
      <TextBody>{THANK_YOU}</TextBody>
      <TextBody>{REFERENCE_CONFIRM}</TextBody>
      <UserSummary user={user} />
      <TextBody>{FURTHER}</TextBody>
      <Button type="submit">SUBMIT</Button>
    </form>
  );
}
