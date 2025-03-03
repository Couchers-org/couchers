"""Remove shared space sleeping arrangement

Revision ID: e6205511239b
Revises: 9b738767992c
Create Date: 2025-02-28 21:36:29.300576

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "e6205511239b"
down_revision = "9b738767992c"
branch_labels = None
depends_on = None


def upgrade():
    # 1. Update all users who have 'shared_space' to NULL (or another appropriate value)
    op.execute("""
        UPDATE users
        SET sleeping_arrangement = NULL
        WHERE sleeping_arrangement = 'shared_space'
    """)

    # 2. Rename the existing enum type to avoid conflict
    op.execute("ALTER TYPE sleepingarrangement RENAME TO sleepingarrangement_old")

    # 3. Create the new enum type without 'shared_space'
    op.execute("""
        CREATE TYPE sleepingarrangement AS ENUM ('private', 'common', 'shared_room')
    """)

    # 4. Alter the 'sleeping_arrangement' column to use the new enum type
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN sleeping_arrangement TYPE sleepingarrangement
        USING sleeping_arrangement::text::sleepingarrangement
    """)

    # 5. Drop the old enum type that includes 'shared_space'
    op.execute("DROP TYPE sleepingarrangement_old")
