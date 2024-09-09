from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.threading import ThreadingInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from couchers.config import config
from couchers.db import _get_base_engine


def setup_tracing():
    if config["OPENTELEMETRY_ENDPOINT"] != "":
        ThreadingInstrumentor().instrument()

        grpc_server_instrumentor = GrpcInstrumentorServer()
        grpc_server_instrumentor.instrument()
        SQLAlchemyInstrumentor().instrument(engine=_get_base_engine(), enable_commenter=True, commenter_options={})

        trace.set_tracer_provider(TracerProvider(resource=Resource(attributes={"service.name": "backend"})))

        trace.get_tracer_provider().add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=config["OPENTELEMETRY_ENDPOINT"], insecure=True))
        )
