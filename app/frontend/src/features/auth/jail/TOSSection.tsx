import React, { useCallback, useState } from "react";
import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import TOS from "../../../components/TOS";
import { acceptTOS } from "../../../service/jail";

export default function TOSSection({
  updateJailed,
}: {
  updateJailed: () => Promise<any>;
}) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const accept = useCallback(async () => {
    setLoading(true);
    const info = await acceptTOS();
    if (!info.isJailed) await updateJailed();
    setLoading(false);
    setCompleted(true);
  }, [updateJailed]);

  return (
    <>
      <TOS />
      <Button loading={loading} onClick={accept} disabled={completed}>
        {completed ? "Thanks!" : "Accept"}
      </Button>
    </>
  );
}
