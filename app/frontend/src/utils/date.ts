// format a date
import moment from "moment";

export function formatDate(date: string): string {
  return moment(date, "YYYY-MM-DD").format("D MMM YYYY");
}
