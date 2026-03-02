import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import DurationPlugin from "dayjs/plugin/duration";
import RelativeTime from "dayjs/plugin/relativeTime";
import Timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(DurationPlugin);
dayjs.extend(RelativeTime);
dayjs.extend(Timezone);

export { Dayjs };
export default dayjs;
