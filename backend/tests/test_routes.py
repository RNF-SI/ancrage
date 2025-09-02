from models.models import Site
from schemas.metier import SiteSchema
from flask import jsonify

def test_request_example(client):
    response = client.get("/sites")
    print("status:", response.status_code)
    print("data:", response.data)
    assert response.status_code == 200, f"Statut retourné: {response.status_code}, data: {response.data}"

def test_site(client):
    # Récupérer un site de la base
    site = Site.query.first()
    schema = SiteSchema()
    site_data = schema.dump(site)
    site_data.pop("id_site", None)
    site_data.pop("slug", None)
    # Faire la requête POST avec les données JSON
    response = client.post("/site/", json=site_data)

    print("status:", response.status_code)
    print("data:", response.get_json())

    assert response.status_code == 200

    new_site = response.get_json()
    site_id = new_site["id_site"]
    slug = new_site["slug"]

    # --- PUT ---
    site_data["nom"] = "Nom du site modifié"
    response = client.put(f"/site/{site_id}/{slug}", json=site_data)
    assert response.status_code == 200

    updated_site = response.get_json()
    assert updated_site["nom"] == "Nom du site modifié"

    # --- DELETE ---
    response = client.delete(f"/site/{site_id}/{slug}")
    assert response.status_code == 204

    # Vérifier que le site a bien été supprimé en base
    deleted = Site.query.get(site_id)
    assert deleted is None