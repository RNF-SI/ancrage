import { FormGroup} from '@angular/forms';


export interface RoleOPNL {

  id_user?: number;
  id_role?: number;
  nom_role?: string;
  prenom_role?: string;
  profil_opnl?: string;

}

export interface RoleOPNLComplements {
  id_user?: number;
  id_role?: number;
  nom?: string;
  prenom?: string;
  profil_opnl?: string;
  organisme?: string;
  email?: string;
}

export const roleOPNLColumns = ["update", "id_role", "nom_role", "prenom_role", "profil_opnl"];

export function keyToRoleOPNLKey(key: string): string{
  switch (key) {
    case 'id':
      return 'id_role';
    case 'nom':
      return 'nom_role';
    case 'prenom':
      return 'prenom_role';
    case 'profil':
      return 'profil_opnl';
    default:
      return key;
  }
}

export function readOnlyRoleOPNLProperties(property: string): boolean{
  return ['id', 'nom', 'prenom'].includes(property)
}

export function createRoleOPNLObject(form: FormGroup): RoleOPNL{
  return <RoleOPNL>{id_role: form.controls['id'].value, nom_role:form.controls['nom'].value, prenom_role:form.controls['prenom'].value, profil_opnl: form.controls['profil'].value}
}

export enum Role {
  administrateur = 'administrateur',
  contributeur = 'contributeur',
  partenaire = 'partenaire'
}
