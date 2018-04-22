from flask import Blueprint

admin_console = Blueprint('admin_console', __name__)

from . import views