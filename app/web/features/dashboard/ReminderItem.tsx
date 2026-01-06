import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { GetRemindersRes } from "proto/account_pb";
import { service } from "service";

export default function ReminderItem() {
  const { data, error, isLoading } = useQuery<
    GetRemindersRes.AsObject,
    RpcError
  >({
    queryKey: ["reminders"],
    queryFn: () => service.account.getReminders(),
  });

  console.log("reminders data:", data);
  console.log("reminders error:", error);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.remindersList.map((reminder, index) => (
        <div key={index}>{JSON.stringify(reminder)}</div>
      ))}
    </div>
  );
}
