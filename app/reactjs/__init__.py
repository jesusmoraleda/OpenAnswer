from flask import Blueprint

reactjs = Blueprint('reactjs', __name__, static_folder='oa/build', url_prefix='/reactjs')

from . import views