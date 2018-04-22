from datetime import datetime
from hashlib import md5
from app import db, lm
from flask_login import UserMixin


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(16), nullable=False, index=True, unique=True)
    email = db.Column(db.String(128), nullable=False, index=True, unique=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    messages = db.relationship('Message', backref='author', lazy='dynamic')
    posts = db.relationship('Post', backref='author', lazy='dynamic')
    ips = db.relationship('UserIp', backref='owner', lazy='dynamic')
    last_seen = db.Column(db.DateTime)
    beta = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return self.username

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'is_admin': self.is_admin,
            'last_seen': self.last_seen,
            'beta': self.beta,
            'is_banned': self.is_banned,
            'gravatar': self.gravatar(60),
        }

    def gravatar(self, size):
        # mm, monsterid, identicon, wavatar, retro, blank are the available defaults
        return 'https://www.gravatar.com/avatar/%s?d=identicon&s=%d' % (md5(self.email.encode('utf-8')).hexdigest(), size)


class UserIp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    ip_address = db.Column(db.String(50))  # http://stackoverflow.com/a/166157/2302482
    timestamp = db.Column(db.DateTime)

    def __repr__(self):
        return "%s | %s" % (self.ip_address, self.timestamp.strftime('%x %X'))


@lm.user_loader
def load_user(user_id):
    # FIXME: memoize this (maybe with expiry)
    u = User.query.get(int(user_id))
    # https://flask-login.readthedocs.io/en/latest/#how-it-works
    # You will need to provide a user_loader callback.
    # This callback is used to reload the user object from the user ID stored in the session.
    # It should take the unicode ID of a user, and return the corresponding user object.
    # It should return None (not raise an exception) if the ID is not valid.
    # (In that case, the ID will manually be removed from the session and processing will continue.).
    # If the user is banned, we don't want to authenticate the user.
    # Returning None leaves them unauthenticated.
    if u.is_banned:
        return None
    return u


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    body = db.Column(db.String(5000))
    timestamp = db.Column(db.DateTime)
    category = db.Column(db.String(128), default='Uncategorized')

    def __repr__(self):
        return '<Post %r>' % self.body


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    content = db.Column(db.Text, nullable=False)
    room = db.Column(db.Text, nullable=False)
    namespace = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return str(self.id)

    def to_dict(self):
        # FIXME: Is this how backrefs are supposed to work? Seems like a waste to query user.. investigate
        user = User.query.get(self.user_id)
        username = user.username if user else '!id %s' % self.user_id
        return {
            'id': self.id,
            'timestamp': self.timestamp,
            'username': username,
            'content': self.content,
            'room': self.room,
            'namespace': self.namespace
        }
