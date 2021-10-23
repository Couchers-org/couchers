import { InfiniteData } from "react-query";

export type EndsWithList = `${string}List`;
export type ObjectWithListValue<TData> = {
  [Key in keyof TData]: Key extends EndsWithList ? unknown[] : unknown;
};

/**
 * Utility function for checking if the resultant infinite data has at least one
 * page of data in.
 * @returns true if there is at least one page of data, false otherwise.
 */
export default function hasAtLeastOnePage<
  TData extends ObjectWithListValue<TData>
>(
  data: InfiniteData<TData> | undefined,
  listKey: keyof TData & EndsWithList
): data is InfiniteData<TData> {
  return !!data && data.pages.length > 0 && data.pages[0][listKey].length > 0;
}
