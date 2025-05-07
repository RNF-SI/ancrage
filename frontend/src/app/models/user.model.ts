
export class User {
  user_login: string;
  id_role: string;
  id_organisme: number;
  // organisme: string;
  prenom_role?: string;
  nom_role?: string;
  nom_complet?: string;

  constructor(user_login: string, id_role: string, id_organisme: number,
    prenom_role?: string, nom_role?: string, nom_complet?: string,) {
    this.user_login = user_login;
    this.id_role = id_role;
    this.id_organisme = id_organisme;
    this.prenom_role = prenom_role;
    this.nom_role = nom_role;
    this.nom_complet =  nom_complet;
  }


}
