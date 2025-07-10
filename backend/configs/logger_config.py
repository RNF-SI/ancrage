import logging
import os

log_dir = "/var/log/ancrage"
log_file = os.path.join(log_dir, "acteurs.log")

# Crée le dossier s'il n'existe pas
os.makedirs(log_dir, exist_ok=True)

# Configuration du logger
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()  # pour garder les logs dans la console aussi
    ]
)

logger = logging.getLogger(__name__)