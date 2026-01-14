import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import { RpcError } from "grpc-web";
import { GetRemindersRes } from "proto/account_pb";
import { service } from "service";

import ReminderItem from "./ReminderItem";

export default function ReminderCarousel() {
  const { data, error } = useQuery<GetRemindersRes.AsObject, RpcError>({
    queryKey: ["reminders"],
    queryFn: () => service.account.getReminders(),
  });

  console.log("reminders data:", data);
  console.log("reminders error:", error);

  return (
    <>
      {error && <Alert severity="error">{error?.message}</Alert>}
      <ReminderItem />
      {/* <ReminderItem reminder={reminder} /> */}
      {/* {data &&
        Object.values(data)
          .filter(Boolean)
          .map((reminder, index) => (
          ))} */}
    </>
  );
}
