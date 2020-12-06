import React, { useState } from "react";
import Button from "../../../components/Button";
import TOS from "../../../components/TOS";
import { service } from "../../../service";

export default function TOSSection({
  updateJailed,
}: {
  updateJailed: () => void;
}) {
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
    <>
      <TOS />
      <Button loading={loading} onClick={accept} disabled={completed}>
        {completed ? "Thanks!" : "Accept"}
      </Button>
    </>
  );
}
