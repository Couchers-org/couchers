import Button from "components/Button";
import TOSLink from "components/TOSLink";
import { useState } from "react";
import { service } from "service";

import { ACCEPT, THANKS } from "../constants";

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
      <TOSLink />
      <Button loading={loading} onClick={accept} disabled={completed}>
        {completed ? THANKS : ACCEPT}
      </Button>
    </div>
  );
}
