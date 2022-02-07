import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import DurationPlugin from "dayjs/plugin/duration";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import Timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(DurationPlugin);
dayjs.extend(Timezone);
dayjs.extend(LocalizedFormat);

const TIME_FORMAT = "HH:mm";

export type Duration = DurationPlugin.Duration;

export { Dayjs, TIME_FORMAT };
export default dayjs;
