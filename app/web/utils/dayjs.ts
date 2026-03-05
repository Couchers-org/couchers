import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import DurationPlugin from "dayjs/plugin/duration";
import RelativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(DurationPlugin);
dayjs.extend(RelativeTime);

export { Dayjs };
export default dayjs;
