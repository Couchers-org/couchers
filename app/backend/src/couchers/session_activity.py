import logging
from multiprocessing import Process
from time import sleep

from sqlalchemy import delete, func, literal_column, select, update
from sqlalchemy.dialects.postgresql import ARRAY, aggregate_order_by
from sqlalchemy.dialects.postgresql import insert as pg_insert

from couchers.db import db_post_fork, session_scope
from couchers.experimentation import setup_experimentation
from couchers.models import SessionTouch, UserActivity, UserSession
from couchers.profiling import setup_profiling
from couchers.tracing import setup_tracing

logger = logging.getLogger(__name__)


def compact_session_activity() -> None:
    """
    Moves every committed session touch into the sessions and user_activity tables, in one statement.
    """
    with session_scope() as session:
        drained = (
            delete(SessionTouch)
            .returning(
                SessionTouch.id,
                SessionTouch.token,
                SessionTouch.user_id,
                SessionTouch.time,
                SessionTouch.ip_address,
                SessionTouch.user_agent,
                SessionTouch.sofa,
                SessionTouch.client_platform,
            )
            .cte("drained")
        )

        per_session = (
            select(drained.c.token, func.max(drained.c.time).label("time"), func.count().label("api_calls"))
            .group_by(drained.c.token)
            .subquery("per_session")
        )
        update_sessions = (
            update(UserSession)
            .where(UserSession.token == per_session.c.token)
            .values(
                last_seen=func.greatest(UserSession.last_seen, per_session.c.time),
                api_calls=UserSession.api_calls + per_session.c.api_calls,
            )
            .cte("update_sessions")
        )

        period = func.date_bin(
            literal_column("interval '1 hour'"), drained.c.time, literal_column("'2000-01-01'::timestamptz")
        ).label("period")
        latest_client_platform = func.array_agg(
            aggregate_order_by(drained.c.client_platform, drained.c.id.desc()),
            type_=ARRAY(SessionTouch.client_platform.type),
        ).filter(drained.c.client_platform.is_not(None))
        per_activity = select(
            drained.c.user_id,
            period,
            drained.c.ip_address,
            drained.c.user_agent,
            drained.c.sofa,
            latest_client_platform[1].label("client_platform"),
            func.count().label("api_calls"),
        ).group_by(drained.c.user_id, period, drained.c.ip_address, drained.c.user_agent, drained.c.sofa)

        insert_activity = pg_insert(UserActivity).from_select(
            ["user_id", "period", "ip_address", "user_agent", "sofa", "client_platform", "api_calls"], per_activity
        )
        session.execute(
            insert_activity.on_conflict_do_update(
                index_elements=[
                    UserActivity.user_id,
                    UserActivity.period,
                    UserActivity.ip_address,
                    UserActivity.user_agent,
                    UserActivity.sofa,
                ],
                set_={
                    "api_calls": UserActivity.api_calls + insert_activity.excluded.api_calls,
                    "client_platform": func.coalesce(
                        insert_activity.excluded.client_platform, UserActivity.client_platform
                    ),
                },
            ).add_cte(update_sessions)
        )


def _compactor_process_entry() -> None:
    db_post_fork()
    setup_experimentation()
    setup_tracing()
    setup_profiling(role="session-activity-compactor", instance="session-activity-compactor")
    while True:
        try:
            compact_session_activity()
        except Exception as e:
            logger.critical("Session activity compaction failed", exc_info=e)
        sleep(5)


def start_session_activity_compactor() -> Process:
    compactor = Process(target=_compactor_process_entry)
    compactor.start()
    return compactor
