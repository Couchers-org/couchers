import dayjs, { Dayjs } from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import Timezone from "dayjs/plugin/timezone";

dayjs.extend(Timezone);
dayjs.extend(LocalizedFormat);
export { Dayjs };
export default dayjs;
