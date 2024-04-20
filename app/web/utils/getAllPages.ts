import { EndsWithList, ObjectWithListValue } from "utils/hasAtLeastOnePage";

interface GetAllPagesParams<TData extends ObjectWithListValue<TData>, TParams> {
  serviceFunction: (params: TParams) => Promise<TData>;
  params: (previousData: TData | undefined) => TParams;
  listKey: keyof TData & EndsWithList;
  hasMore: (previousData: TData) => boolean;
  maxPages?: number;
}
export default async function getAllPages<
  TData extends ObjectWithListValue<TData>,
  TParams
>({
  serviceFunction,
  params,
  listKey,
  hasMore,
  maxPages = 10,
}: GetAllPagesParams<TData, TParams>) {
  let page = 0;
  let previousData = undefined;
  const nestedResults = [];
  while (true) {
    const data: TData = await serviceFunction(params(previousData));
    nestedResults.push(data[listKey]);
    previousData = data;
    page++;
    if (!hasMore(data) || page >= maxPages) {
      break;
    }
  }
  return nestedResults.flat(1);
}
