import moment from 'moment'

export function displayList(list: string[]) {
  return list.join(', ')
}

export function displayTime(ts: { seconds: number; nanos: number }) {
  return moment(new Date((ts.seconds * 1000) + (ts.nanos / 1000000))).fromNow()
}
