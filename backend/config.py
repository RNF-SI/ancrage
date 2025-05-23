import os

class Config :
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:postgres@localhost/ancrage"
    #typebdd://username:password@server/db
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    basedir = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(basedir, 'fichiers')