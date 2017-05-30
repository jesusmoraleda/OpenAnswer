from sqlalchemy import *
from migrate import *
from datetime import datetime

from migrate.changeset import schema
pre_meta = MetaData()
post_meta = MetaData()
message = Table('message', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('timestamp', DateTime, default=ColumnDefault(datetime.utcnow)),
    Column('user_id', Integer, nullable=False),
    Column('content', Text, nullable=False),
    Column('room', Text, nullable=False),
    Column('namespace', Text, nullable=False),
)


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['message'].create()


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['message'].drop()
