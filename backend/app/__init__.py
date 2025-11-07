from config import Config
from flask import Flask
from models.models import db
from routes import bp
from flask_migrate import Migrate
from flask_cors import CORS
from extensions import mail 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    migrate = Migrate(app, db)
    migrate.init_app(app, db)
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    

    import pypnusershub.db
    import pypnusershub.db.models as pypn_models
    import pypnusershub.auth

    pypnusershub.db.db = db
    pypn_models.db = db
    pypnusershub.auth.db = db

    CORS(app,
     supports_credentials=True,
     origins=[app.config["DOMAIN_FRONT"]],
     allow_headers=["Content-Type", "Authorization"]
    )

    app.config["DB"] = db

    # 3. Ensuite seulement login_manager / auth_manager
    from pypnusershub.login_manager import login_manager
    from pypnusershub.auth import auth_manager

    import pypnusershub.login_manager
    pypnusershub.login_manager.db = db
    
    login_manager.init_app(app)

    providers_config = [
        {"module": "pypnusershub.auth.providers.default.LocalProvider",
        "id_provider": "local_provider"}
    ]
    auth_manager.init_app(app, providers_declaration=providers_config)

    # 4. Enfin, les routes de pypnusershub
    from pypnusershub import routes_register
    from pypnusershub.routes import routes as auth_routes
    app.register_blueprint(auth_routes, url_prefix="", name="pypn_auth")
    app.register_blueprint(routes_register.bp, url_prefix="", name="pypn_register")

    app.register_blueprint(bp)

    return app

    