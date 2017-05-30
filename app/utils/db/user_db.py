def ses_user():
    from .database import init_db, db_session
    init_db()
    from app.models import User
    usr_query = db_session.query(User)
    return db_session, usr_query