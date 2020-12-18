import { Box } from "@material-ui/core";
import React, { useState } from "react";
import Button from "../../../components/Button";
import TOS from "../../../components/TOS";
import { service } from "../../../service";

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
    <Box className={className}>
      <TOS />
      <Button loading={loading} onClick={accept} disabled={completed}>
        {completed ? "Thanks!" : "Accept"}
      </Button>
    </Box>
  );
}
