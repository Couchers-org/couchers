from collections.abc import Sequence

from opentelemetry import trace
from opentelemetry.context import Context
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.threading import ThreadingInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, Sampler, SamplingResult, TraceIdRatioBased
from opentelemetry.trace import Link, SpanKind
from opentelemetry.trace.span import TraceState
from opentelemetry.util.types import Attributes

from couchers.config import config
from couchers.db import _get_base_engine
from couchers.experimentation import get_global_float_value


class FeatureFlagRatioSampler(Sampler):
    """
    Samples the fraction of traces given by the `trace_sample_ratio` flag (default 0). Wired as the
    ParentBased root, so it's consulted only for root spans - one flag read per RPC, not per span.
    """

    def should_sample(
        self,
        parent_context: Context | None,
        trace_id: int,
        name: str,
        kind: SpanKind | None = None,
        attributes: Attributes = None,
        links: Sequence[Link] | None = None,
        trace_state: TraceState | None = None,
    ) -> SamplingResult:
        ratio = get_global_float_value("trace_sample_ratio", 0.0)
        return TraceIdRatioBased(ratio).should_sample(
            parent_context, trace_id, name, kind, attributes, links, trace_state
        )

    def get_description(self) -> str:
        return "FeatureFlagRatioSampler{flag=trace_sample_ratio}"


def setup_tracing() -> None:
    if config.OPENTELEMETRY_ENDPOINT != "":
        ThreadingInstrumentor().instrument()

        grpc_server_instrumentor = GrpcInstrumentorServer()  # type: ignore[no-untyped-call]
        grpc_server_instrumentor.instrument()
        SQLAlchemyInstrumentor().instrument(engine=_get_base_engine(), enable_commenter=True, commenter_options={})

        tracer = TracerProvider(
            resource=Resource(attributes={"service.name": "backend"}),
            sampler=ParentBased(root=FeatureFlagRatioSampler()),
        )
        headers = (
            {"authorization": f"Bearer {config.OPENTELEMETRY_AUTH_TOKEN}"} if config.OPENTELEMETRY_AUTH_TOKEN else None
        )
        tracer.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=config.OPENTELEMETRY_ENDPOINT, headers=headers))
        )

        trace.set_tracer_provider(tracer)
