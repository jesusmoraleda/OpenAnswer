from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import models

OLD_SQLALCHEMY_DATABASE_URI = 'sqlite:////path/to/old_app.db'
NEW_SQLALCHEMY_DATABASE_URI = 'sqlite:////path/to/new_app.db'


def get_session(uri):
    engine = create_engine(uri, echo=True)
    Session = sessionmaker(bind=engine)
    return Session()

old_session = get_session(OLD_SQLALCHEMY_DATABASE_URI)
new_session = get_session(NEW_SQLALCHEMY_DATABASE_URI)

models_to_query = [models.User, models.Message, models.Post, models.UserIp]

# https://stackoverflow.com/questions/45802620/copying-data-from-one-sqlalchemy-session-to-another
for klass in models_to_query:
    for o in old_session.query(klass).all():
        new_session.merge(o)
    new_session.commit()

new_lengths = []

for klass in models_to_query:
    new_lengths.append((
        klass.__name__,
        len(list(new_session.query(klass).all()))
    ))

print(new_lengths)