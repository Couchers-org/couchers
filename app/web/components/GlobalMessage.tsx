import { Alert as MuiAlert } from "@material-ui/lab/";
import React, { useEffect, useState } from "react";

interface GlobalMessageData {
  severity: "success" | "info" | "warning" | "error";
  message: string;
}

export function GlobalMessage() {
  const [data, setData] = useState<GlobalMessageData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_GLOBAL_MESSAGE_URL
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        setData(await response.json());
      } catch (error) {
        console.error("Error fetching global message:", error);
      }
    };

    fetchData();
  }, []);

  return data && data.message ? (
    <MuiAlert severity={data.severity}>
      <span dangerouslySetInnerHTML={{ __html: data.message }} />
    </MuiAlert>
  ) : null;
}
