import { InjectionToken } from '@angular/core';

export const APP_CONFIG_TOKEN = new InjectionToken<any>('AppConfig');

// TODO: Clean and remove useless code after merge

export const AppConfig = {
 "ID_APPLICATION_GEONATURE": 5,
 "API_ENDPOINT": "http://127.0.0.1:5080",
//  "OPNL_LOGO": "logo_opnl.png",
 "appName": "OPNL",
 "MAPCONFIG": {
  "ZOOM_LEVEL_RELEVE": 15,
  "RELEVE_MAP_ZOOM_LEVEL": 6,
  "ENABLE_UPLOAD_TOOL": true,
  "ZOOM_ON_CLICK": 18,
  "CENTER": [
   46.52863469527167,
   2.43896484375
  ],
  "ZOOM_LEVEL": 6,
  "BASEMAP": [
   {
    "name": "OpenStreetMap",
    "url": "//{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    "options": {
     "attribution": "&copy OpenStreetMap"
    }
   },
   {
    "name": "OpenTopoMap",
    "url": "//a.tile.opentopomap.org/{z}/{x}/{y}.png",
    "options": {
     "attribution": "\u00a9 OpenTopoMap"
    }
   },
   {
    "name": "GoogleSatellite",
    "layer": "//{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    "options": {
     "subdomains": [
      "mt0",
      "mt1",
      "mt2",
      "mt3"
     ],
     "attribution": "\u00a9 GoogleMap"
    }
   }
  ],
  // afficher l'outil pour pointer un marker à partir des coordonnées X/Y
  "ENABLE_GPS_TOOL" : true,
  // Activer l'outil "Mes lieux" permettant d'enregistrer et de charger les lieux des utilisateurs
  "ENABLE_MY_PLACES" : true
 },
};
