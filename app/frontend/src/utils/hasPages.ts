import { InfiniteData } from "react-query";

type EndsWithList = `${string}List`;
type ObjectWithListValue<TData> = {
  [Key in keyof TData]: Key extends EndsWithList ? unknown[] : unknown;
};

export default function hasPages<TData extends ObjectWithListValue<TData>>(
  data: InfiniteData<TData> | undefined,
  listKey: keyof TData & EndsWithList
): data is InfiniteData<TData> {
  return !!data && data.pages.length > 0 && data.pages[0][listKey].length > 0;
}
