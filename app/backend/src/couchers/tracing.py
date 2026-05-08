from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.threading import ThreadingInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from couchers.config import Config
from couchers.db import _get_base_engine


def setup_tracing() -> None:
    if Config.current.opentelemetry_endpoint != "":
        ThreadingInstrumentor().instrument()

        grpc_server_instrumentor = GrpcInstrumentorServer()  # type: ignore[no-untyped-call]
        grpc_server_instrumentor.instrument()
        SQLAlchemyInstrumentor().instrument(engine=_get_base_engine(), enable_commenter=True, commenter_options={})

        tracer = TracerProvider(resource=Resource(attributes={"service.name": "backend"}))
        tracer.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=Config.current.opentelemetry_endpoint, insecure=True))
        )

        trace.set_tracer_provider(tracer)
