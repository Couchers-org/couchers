import { Typography } from "@material-ui/core";
import { REFERENCE_FORM_HEADING } from "features/communities/constants";
import { User } from "pb/api_pb";

interface ReferenceFormProps {
  user: User.AsObject;
}

export default function ReferenceForm({ user }: ReferenceFormProps) {
  return (
    <Typography variant="h1">
      {REFERENCE_FORM_HEADING}
      {user.name}
    </Typography>
  );
}
