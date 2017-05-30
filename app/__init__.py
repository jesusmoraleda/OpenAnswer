from flask import Flask
from flask_admin import Admin
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from .utils.markup.momentjs import MomentJs

# Create and configure the app
app = Flask(__name__)
app.config.from_object('config')
app.jinja_env.globals['momentjs'] = MomentJs

# Set up the database and login manager
db = SQLAlchemy(app)
lm = LoginManager(app)
lm.login_view = 'home'

# Set up socketio for chat
socketio = SocketIO()
socketio.init_app(app)

from app import views, models

# Administration page
admin = Admin(app, name='OpenAnswer', template_mode='bootstrap3')
admin.add_view(views.AdminModelView(models.User, db.session))
admin.add_view(views.AdminModelView(models.UserIp, db.session))
admin.add_view(views.AdminModelView(models.Post, db.session))
admin.add_view(views.AdminModelView(models.Message, db.session))

# Chat page
from app.chat import chat as chat_blueprint
app.register_blueprint(chat_blueprint)

# Api
from app.api import api as api_blueprint
app.register_blueprint(api_blueprint)


