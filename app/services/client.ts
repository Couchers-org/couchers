import {
  DescMessage,
  DescMethodBiDiStreaming,
  DescMethodClientStreaming,
  DescMethodServerStreaming,
  DescMethodUnary,
  DescService,
  MessageShape,
} from "@bufbuild/protobuf";
import {
  CallOptions,
  Transport,
  createClient as createRpcConnectClient,
} from "@connectrpc/connect";

type ArgMessageShape<Desc extends DescMessage> = {
  [Key in keyof MessageShape<Desc> as Key extends "$unknown" | "$typeName"
    ? never
    : Key]: MessageShape<Desc>[Key];
};

// The default client doesn't enforce sending required parameters, so we create our own type that does
export type Client<Desc extends DescService> = {
  [P in keyof Desc["method"]]: Desc["method"][P] extends DescMethodUnary<
    infer I,
    infer O
  >
    ? (
        request: ArgMessageShape<I>,
        options?: CallOptions,
      ) => Promise<MessageShape<O>>
    : Desc["method"][P] extends DescMethodServerStreaming<infer I, infer O>
      ? (
          request: ArgMessageShape<I>,
          options?: CallOptions,
        ) => AsyncIterable<MessageShape<O>>
      : Desc["method"][P] extends DescMethodClientStreaming<infer I, infer O>
        ? (
            request: AsyncIterable<ArgMessageShape<I>>,
            options?: CallOptions,
          ) => Promise<MessageShape<O>>
        : Desc["method"][P] extends DescMethodBiDiStreaming<infer I, infer O>
          ? (
              request: AsyncIterable<ArgMessageShape<I>>,
              options?: CallOptions,
            ) => AsyncIterable<MessageShape<O>>
          : never;
};

const createClient = createRpcConnectClient as <Desc extends DescService>(
  desc: Desc,
  transport: Transport,
) => Client<Desc>;

export default createClient;
