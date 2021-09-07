import { Typography } from "@material-ui/core";
import Button from "components/Button";
import TOSLink from "components/TOSLink";
import { ACCEPT, THANKS } from "features/auth/constants";
import { useState } from "react";
import { service } from "service";

import { JAIL_TOS_TEXT } from "./constants";

interface TOSSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function TOSSection({
  updateJailed,
  className,
}: TOSSectionProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    const info = await service.jail.acceptTOS();
    if (!info.isJailed) {
      updateJailed();
    } else {
      //if user is no longer jailed, this component will be unmounted anyway
      setLoading(false);
      setCompleted(true);
    }
  };

  return (
    <div className={className}>
      <Typography variant="body1">
        {JAIL_TOS_TEXT}
        <TOSLink />.
      </Typography>
      <Button loading={loading} onClick={accept} disabled={completed}>
        {completed ? THANKS : ACCEPT}
      </Button>
    </div>
  );
}
