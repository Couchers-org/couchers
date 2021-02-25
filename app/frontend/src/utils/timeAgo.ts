import moment from "moment";

export function timeAgo(date: Date) {
  //the backend fuzzes times to 15 minute intervals
  if (new Date().getTime() - +date < 15 * 60 * 1000) {
    return "< 15 minutes ago";
  }
  return moment(date).fromNow();
}
