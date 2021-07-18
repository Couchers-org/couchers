import pandas as pd

from couchers.db import session_scope
from couchers.models import Cluster


def get_table_columns(table):
    with session_scope() as session:
        query = session.query(table).limit(0)
        df = pd.read_sql(query.statement, query.session.bind)
        return list(df.columns)


def get_dataframe(table):
    with session_scope() as session:
        query = session.query(table)
        return pd.read_sql(query.statement, query.session.bind)


def update_community_description(node_id, description, overide_length_constraint=False):

    if len(description) > 500 and not overide_length_constraint:
        print(
            f"The description length is {len(description)}. The limit is 500 characters."
        )
        return

    with session_scope() as session:
        community = (
            session.query(Cluster).filter(Cluster.parent_node_id == node_id).one()
        )
        community.description = description
        name = community.name
        new_description = community.description
    print(f"The {name} community description has been updated to:\n{new_description}")
