import { GetDashboardReq } from "proto/screens_pb";

import client from "./client";

export async function getDashboard() {
  const res = await client.screens.getDashboard(new GetDashboardReq());
  return res.toObject();
}
