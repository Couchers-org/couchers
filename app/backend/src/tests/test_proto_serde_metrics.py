from couchers.metrics import proto_serde_histogram
from couchers.proto import auth_pb2
from couchers.proto_serde_metrics import install_proto_serde_metrics


def _count(message, direction):
    return sum(
        s.value
        for m in proto_serde_histogram.collect()
        for s in m.samples
        if s.name == "couchers_proto_serde_seconds_count"
        and s.labels.get("message") == message
        and s.labels.get("direction") == direction
    )


def test_proto_serde_metrics():
    install_proto_serde_metrics()
    install_proto_serde_metrics()

    name = auth_pb2.SignupFlowReq.DESCRIPTOR.full_name
    serialize_before = _count(name, "serialize")
    deserialize_before = _count(name, "deserialize")

    req = auth_pb2.SignupFlowReq(flow_token="token")
    data = req.SerializeToString()
    req.SerializePartialToString()
    assert auth_pb2.SignupFlowReq.FromString(data) == req
    parsed = auth_pb2.SignupFlowReq()
    parsed.ParseFromString(data)
    parsed.MergeFromString(data)
    assert parsed == req

    assert _count(name, "serialize") == serialize_before + 2
    assert _count(name, "deserialize") == deserialize_before + 3
