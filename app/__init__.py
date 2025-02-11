import os
from flask import Flask, request
from flask_admin import Admin
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bootstrap import Bootstrap
from .utils.markup.momentjs import MomentJs

# Create and configure the app
app = Flask(__name__)

app.config.from_object('config')
app.jinja_env.globals['momentjs'] = MomentJs


# TODO remember to add rules for nginx once we start serving static content there
@app.url_defaults
def hashed_static_file(endpoint, values):
    if endpoint == 'static':
        filename = values.get('filename')
        if filename:
            blueprint = request.blueprint if '.' not in endpoint else endpoint.rsplit('.', 1)[0]

            # needed for os.path
            static_folder = app.static_folder
            if blueprint and app.blueprints[blueprint].static_folder:
                static_folder = app.blueprints[blueprint].static_folder

            fp = os.path.join(static_folder, filename)
            if os.path.exists(fp):
                values['_'] = int(os.stat(fp).st_mtime)


# TODO might not be the best idea to invalidate all HTML caches; should revisit
@app.after_request
def apply_cache_headers(response):
    if 'html' in request.headers.get('Accept', ''):
        response.headers["Cache-Control"] = "no-store, must-revalidate"
    return response

# Set up the database and login manager
db = SQLAlchemy(app)
migrate = Migrate(app, db)

lm = LoginManager(app)
lm.login_view = 'home'

# Set up socketio for chat
# FIXME: reenable CORS once we get the urls together, maybe store them in an environment:
# i.e. cors_allowed_origins=os.environ['OA_ALLOWED_ORIGINS']
socketio = SocketIO(cors_allowed_origins=[])
socketio.init_app(app)

# Bootstrap fix the forms please
bootstrap = Bootstrap(app)

from app import views, models

# Administration page
admin = Admin(app, name='OpenAnswer', template_mode='bootstrap3')
admin.add_view(views.AdminUserModelView(models.User, db.session))
admin.add_view(views.AdminModelView(models.UserIp, db.session))
admin.add_view(views.AdminModelView(models.Post, db.session))
admin.add_view(views.AdminMessageModelView(models.Message, db.session))

# Chat page
from app.chat import chat as chat_blueprint
app.register_blueprint(chat_blueprint)

# Api
from app.api import api as api_blueprint
app.register_blueprint(api_blueprint)

# Admin console
from app.admin_console import admin_console as admin_console_blueprint
app.register_blueprint(admin_console_blueprint)

# Reactjs demo
from app.reactjs import reactjs as reactjs_blueprint
app.register_blueprint(reactjs_blueprint)
