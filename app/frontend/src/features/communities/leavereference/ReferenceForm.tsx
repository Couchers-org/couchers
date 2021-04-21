import { Typography } from "@material-ui/core";
import { User } from "pb/api_pb";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function ReferenceForm({ user }: ReferenceFormProps) {
  return <Typography variant="h1">You met with {user.name}</Typography>;
}
