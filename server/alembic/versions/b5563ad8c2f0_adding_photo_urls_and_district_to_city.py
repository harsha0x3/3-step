"""adding photo urls and district to city

Revision ID: b5563ad8c2f0
Revises: ee6540c71757
Create Date: 2025-10-31 16:30:57.877722

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "b5563ad8c2f0"
down_revision: Union[str, Sequence[str], None] = "ee6540c71757"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: rename district → city"""
    # Rename columns instead of dropping/adding
    op.alter_column(
        "candidates",
        "district",
        new_column_name="city",
        existing_type=sa.String(length=64),
    )
    op.alter_column(
        "stores",
        "district",
        new_column_name="city",
        existing_type=sa.String(length=100),
    )


def downgrade() -> None:
    """Downgrade schema: rename city → district"""
    op.alter_column(
        "candidates",
        "city",
        new_column_name="district",
        existing_type=sa.String(length=64),
    )
    op.alter_column(
        "stores",
        "city",
        new_column_name="district",
        existing_type=sa.String(length=100),
    )
