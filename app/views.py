from datetime import datetime
from app import app, db
from app.oauth import OAuthSignIn
from flask import flash, g, redirect, render_template, url_for
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.sql import exists
from .forms import SignupForm, PostForm
from . import models
from .utils.utils import get_remote_addr
from .utils.decorators.admin import admin_required
import os
import logging


@app.before_request
def before_request():
    g.user = current_user
    if g.user.is_authenticated:
        g.user.last_seen = datetime.utcnow()
        db.session.add(g.user)
        db.session.commit()


def _login_user_and_record_ip(usr, remember=True):
    db.session.add(models.UserIp(user_id=usr.id, ip_address=get_remote_addr(), timestamp=datetime.utcnow()))
    db.session.commit()
    login_user(usr, remember)


@app.route('/')
def home():
    if not current_user.is_anonymous:
        return redirect(url_for('chat.alpha_chat'))
    return render_template('home.html', title='Welcome to OpenAnswer')


@app.route('/logs/')
@app.route('/logs/<path>')
@admin_required
def logs(path=None):
    path = path or 'gunicorn'
    locations = {
        'gunicorn': './gunicorn_logs',
        'access': '/var/log/nginx/access.log',
        'error': '/var/log/nginx/error.log',
    }
    lines = ['Log not found']
    try:
        with open(locations[path]) as f:
            lines = f.readlines()
    # Don't want to clutter logs with additional exceptions for no reason
    except Exception:
        pass
    return render_template('logs.html', log_content=lines)


@app.route('/beta_keys')
@admin_required
def beta_keys():
    if not current_user.is_admin:
        return
    lines = ['Beta keys not found.']
    try:
        with open(os.environ['BETA_KEYS_PATH']) as f:
            lines = f.readlines()
    # Don't want to clutter logs with additional exceptions for no reason
    except Exception:
        pass
    return render_template('logs.html', log_content=lines)


@app.route('/gen_beta_keys')
@admin_required
def gen_beta_keys():
    try:
        # FIXME: This is stupid, we should generate this ourselves
        # >>> import uuid
        # >>> uuid.uuid4()
        os.system(
            'wget -qO- uuidgenerator.net/version4/bulk?amount4=10 >> {path}'.format(path=os.environ['BETA_KEYS_PATH'])
        )
    except Exception as e:
        logging.exception('Beta keys not generated', )
    return redirect(url_for('beta_keys'))


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/user/<username>')
@login_required
def user(username):
    _user = models.User.query.filter_by(username=username).first()
    if not _user:
        flash('User %s not found' % username)
        return redirect(url_for('home'))
    posts = models.Post.query.filter_by(user_id=_user.id)
    return render_template('user.html', title='Profile', user=_user, posts=posts, navtab='user')


@app.route('/signup/<email>', methods=['GET', 'POST'])
def signup(email):
    is_beta = os.environ.get('IS_BETA')
    form = SignupForm()
    if form.validate_on_submit():
        username = form.username.data
        if not db.session.query(exists().where(models.User.username == username)).scalar():
            _user = models.User(username=username, email=email)
            db.session.add(_user)
            db.session.commit()
            if is_beta:
                with open(os.environ['BETA_KEYS_PATH'], 'r') as f:
                    keys = set(key.strip() for key in f.readlines())
                keys.remove(form.beta_key.data)
                with open(os.environ['BETA_KEYS_PATH'], 'w') as f:
                    f.write('\n'.join(keys))
            _login_user_and_record_ip(_user)
            return redirect(url_for('home'))
        else:
            form.username.errors.append('That username has been registered, please pick a new one')
    return render_template('signup.html', title='Signup', form=form, is_beta=is_beta)


@app.route('/authorize/<provider>')
def oauth_authorize(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('home'))
    oauth = OAuthSignIn.get_provider(provider)
    return oauth.authorize()


@app.route('/callback/<provider>')
def oauth_callback(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('home'))
    oauth = OAuthSignIn.get_provider(provider)
    email = oauth.callback()
    if email is None:
        flash('Authentication failed.')
        return redirect(url_for('home'))
    _user = models.User.query.filter_by(email=email).first()
    if not _user:
        return redirect(url_for('signup', email=email))
    _login_user_and_record_ip(_user, True)
    return redirect(url_for('home'))


@app.route('/meta', methods=['GET', 'POST'])
@login_required
def meta():
    meta_posts = models.Post.query.filter_by(category='Meta')
    form = PostForm()
    if form.validate_on_submit():
        # FIXME: Don't allow duplicate posts
        _post = models.Post(user_id=g.user.id, body=form.content.data, category=form.category.data, timestamp=datetime.utcnow())
        db.session.add(_post)
        db.session.commit()
    return render_template('meta.html', title='Meta', posts=meta_posts, form=form, navtab='meta')


@app.route('/help')
def help():
    return render_template('help.html', title='Help', navtab='help')


@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html', title='Settings', navtab='settings', user=current_user)


# Admin views here
class AdminModelView(ModelView):
    page_size = 200

    def is_accessible(self):
        return g.user.is_authenticated and g.user.is_admin

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('home'))


class AdminUserModelView(AdminModelView):
    column_editable_list = ['username']
    form_excluded_columns = ['messages', 'ips']


class AdminMessageModelView(AdminModelView):
    column_searchable_list = ['author.username', 'content', 'room']
    column_filters = ['author.username', 'content', 'room']



