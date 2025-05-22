class Config :
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:postgres@localhost/ancrage"
    #typebdd://username:password@server/db
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER='./fichiers'