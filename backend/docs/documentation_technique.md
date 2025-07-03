<h1>Documentation technique ancrage</h1>

L’application comprend deux parties :
-	Une application backend en python avec Flask reliée à une base de données PostGreSQL
-	Une application frontend en typescript et Angular 19
Le fichier readme indique comment installer le projet. 

Elle est conçue pour être exécutée dans un environnement Linux. Si vous êtes sous Windows, il faut installer WSL.

<h2>Backend</h2>
Tous les modèles sont définis dans le fichier models.py du répertoire models.
Un dossier routes comprend une série de routes regroupées par modèle. Les fichiers routes du répertoire doivent être importés dans le fichier __init__.py du même répertoire. De même, pour les variables globales. 

    from flask import Blueprint
    from datetime import datetime
    from slugify import slugify
    from sqlalchemy.orm import joinedload,aliased,relationship
    from sqlalchemy import and_,func,text
    import uuid

    bp = Blueprint('main', __name__)
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    # Importe toutes les routes ici (elles s’enregistreront sur ce blueprint)
    from . import diagnostics, sites, nomenclatures,regions, departements,acteurs,communes,questions,mot_cle,reponses

Les logs s’enregistrent dans le répertoire /var/log/ancrage.

<h2>Frontend</h2>
Le projet a été converti en Angular 19. Dans cette version, les composants sont "standalone" par défaut. Il n'est donc plus nécessaire de préciser standalone:true. En revanche, pour les autres éléments, il faut encore le préciser.

    @Component({
        selector: 'app-acteur',
        templateUrl: './acteur.component.html',
        styleUrls: ['./acteur.component.css'],
        imports:[CommonModule,MatFormFieldModule,ReactiveFormsModule,MatSelectModule,FormsModule,MatInputModule,MatAutocompleteModule,MatButtonModule,MatProgressSpinnerModule]
    })

Les modules et les sous-composants utilisés doivent être importés dans un tableau comme le montre le code ci-dessus. Le fichier app-module.ts n'existe plus. Il a été décomposé en un fichier app.routes.ts pour les routes et main.ts. Dans celui-ci, les providers sont définis dans un objet bootstrapApplication.
    
    import { bootstrapApplication } from '@angular/platform-browser';
    import { AppComponent } from './app/app.component';
    import { provideAnimations } from '@angular/platform-browser/animations';
    import { provideRouter } from '@angular/router';
    import { routes } from './app/app.routes'
    import { provideHttpClient } from '@angular/common/http';
    import { library } from '@fortawesome/fontawesome-svg-core';
    import { faFacebook } from '@fortawesome/free-brands-svg-icons';
    import { provideToastr } from 'ngx-toastr';
    import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
    import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';

    library.add(faFacebook)

    bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(routes),
        provideAnimations(),
        provideHttpClient(), 
        provideToastr(),
        {
        provide: DateAdapter,
        useClass: MomentDateAdapter,
        deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },
        { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
        { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
    ]
    }).catch(err => console.error(err));
    
Les services doivent être déclarés en variable privée avec la méthode inject().

    private siteService = inject(SiteService);

Les ngIf et ngFor sont remplacés par @if(){} et @for(){} :

    @if (isLoading) {
          <app-loading-spinner></app-loading-spinner>
    }

    <mat-select formControlName='categories' multiple>
        @for (cat of uniqueCategories; track cat) {
            <mat-option [value]='cat'>{{ cat.libelle }}</mat-option>
        }
    </mat-select>

Chaque modèle est couplé à une interface et comprend trois méthodes copy, fromJson et toJson. Il faut donc penser à chaque modification ou création de modèle, à compléter ou créer les interfaces et implémenter les trois méthodes. Les modèles n’ont pas de constructeur défini : cela permet de déclarer des instances avec des valeurs par défaut. Voici un exemple avec MotCle :

 - modèle :
    
        export class MotCle {
            id_mot_cle=0;
            nom="";
            reponses?:Reponse[];
            categorie:Nomenclature = new Nomenclature();
            mots_cles_issus:MotCle[]=[];
            diagnostic:Diagnostic = new Diagnostic();
            mot_cle_id_groupe?:number;
            nombre?:number;
            afom_id?:number;
            is_actif=false;

            copy(): MotCle {
                const copy = new MotCle();

                copy.id_mot_cle = this.id_mot_cle;
                copy.nom = this.nom;
                copy.reponses = this.reponses?.map(r => r.copy()) || [];
                copy.mots_cles_issus = this.mots_cles_issus?.map(r => r.copy()) || [];
                copy.categorie = this.categorie.copy();
                copy.diagnostic = this.diagnostic.copy();
                copy.mot_cle_id_groupe = this.mot_cle_id_groupe;
                copy.is_actif = this.is_actif;
                return copy;
            }

            static fromJson(data: IMotCle): MotCle {
                const mot_cle = new MotCle();

                mot_cle.id_mot_cle = data.id_mot_cle;
                mot_cle.nom = data.nom;
                mot_cle.reponses = (data.reponses || []).map(r => Reponse.fromJson(r));
                mot_cle.mots_cles_issus = (data.mots_cles_issus || []).map(mc => MotCle.fromJson(mc));
                mot_cle.categorie = Nomenclature.fromJson(data.categorie);
                mot_cle.diagnostic = Diagnostic.fromJson(data.diagnostic);
                mot_cle.mot_cle_id_groupe = data.mot_cle_id_groupe;
                mot_cle.is_actif = data.is_actif;
                return mot_cle;
            }

            toJson(): IMotCle {
                return {
                    ...this,
                    reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
                    mots_cles: this.mots_cles_issus ? this.mots_cles_issus.map(r => r.toJson()) : [],
                    categorie: this.categorie.toJson(),
                    diagnostic: this.diagnostic!.toJson(),
                };
            }
        }

 - interface :
            ``export interface IMotCle {
                id_mot_cle:number;
                nom:string;
                reponses?:Reponse[];
                categorie:Nomenclature;
                mots_cles_issus:MotCle[];
                diagnostic:Diagnostic;
                mot_cle_id_groupe?:number;
                is_actif:boolean;
            }``

Dans copy :

 - les variables simples renvoient à this suivi du nom de la variable :
    ``copy.id_mot_cle = this.id_mot_cle;``
 - les variables de type Objet ont ce format. Il faut aussi que cet Objet implémente sa propre méthode copy (ici diagnostic = new Diagnostic()) :
    ``copy.diagnostic = this.diagnostic.copy();``
 - les variables de type Liste d'objets ont ce format. Il faut aussi que cet Objet implémente sa propre méthode copy (ici reponses:Reponses[]) :
    ``copy.reponses = this.reponses?.map(r => r.copy()) || [];``

Dans fromJson, data est une interface correspondant à la classe modèle (ici IMotCle).
 - pour les variables simples, le format est le suivant :
    ``mot_cle.id_mot_cle = data.id_mot_cle;``
 - pour les variables Objet (ici categorie = new Nomenclature()). L'objet doit avoir sa propre méthode fromJson().
    ``mot_cle.categorie = Nomenclature.fromJson(data.categorie);``
 - pour les variables listes d'objets (ici mots_cles_issus:MotCle[] = []). L'objet de la liste doit avoir sa propre méthode fromJson().
    ``mot_cle.mots_cles_issus = (data.mots_cles_issus || []).map(mc => MotCle.fromJson(mc));``

Dans toJson, il ne faut renseigner que les champs de type Objet ou liste d'objets. Notez le this précédé de points de suspension. Il copie les champs de type number,string ou boolean.
 - le format pour les variables de type liste d'Objets est (ici reponses:Reponse[] = []). L'objet de la liste doit avoir sa propre méthode toJson().
    ``reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],``
 - pour les variables de type Objet (ici categorie = new Categorie()). L'objet doit avoir sa propre méthode toJson().
    ``categorie: this.categorie.toJson(),``
    

Chaque modèle est aussi relié à un service. Les méthodes appelant l’API retournent des Observable du modèle renvoyé par l’API. 

    update(mot_cle:MotCle): Observable<MotCle> {
      const route = this.BASE_URL + '/' + mot_cle.id_mot_cle;
      
      return this.http.put<IMotCle>(route, mot_cle.toJson()).pipe(
        map(mot_cleJson => MotCle.fromJson(mot_cleJson))
      );
	}

Dans le composant, les méthodes ngOnInit, ngAfterViewInit ont été remplacées par une méthode effect() implémentée dans le constructeur

    constructor() {
        effect(() => {
            this.previousPage.set(localStorage.getItem('previousPage')!);
            const { id_diagnostic, slug } = this.routeParams() as Params;
            const id = Number(id_diagnostic);
            const slugValue = slug as string;
        
            if (id && slugValue) {
                this.id_diagnostic.set(id);
                this.slug.set(slugValue);
        
                forkJoin({
                    diag: this.diagnosticService.get(id, slugValue),
                    themes: this.nomenclatureService.getAllByType('thème'),
                }).subscribe(({ diag, themes }) => {
                    this.diagnostic.set(diag);
                    this.diag = this.diagnostic();
                    this.themes.set(themes);
                    this.actors.set(this.diagnostic().acteurs);
                    const user = this.authService.getCurrentUser();
                    this.id_role.set(user.id_role);
            
                    const isOwner = user.id_role === diag.created_by;
                    const isReadOnly = !isOwner || diag.is_read_only;
            
                    this.is_read_only.set(isReadOnly);
                });
            }
        });
    }

Les observables qui utilisent encore des Subscription doivent être détruits dans la méthode ngOnDestroy(){}. Il faut donc implémenter OnDestroy sur les composants concernés.

    ngOnDestroy(): void {
        
        this.communeSubscription?.unsubscribe();
        this.actorSubscription?.unsubscribe();
    }

Lorsque plusieurs routes de l'API doivent être appelées en même temps, un forkJoin est utilisé comme le montre le bout de code précédent.

On remplace la plupart des variables par des signaux déclarés de cette façon : "diagnostic = signal<Diagnostic>(new Diagnostic())" La valeur entre parenthèse est celle par défaut. Attention, pour récupérer l'objet Diagnostic il faut ajouter des parenthèses : "const diag:Diagnostic = this.diagnostic();"
Les @Input() sont remplacés par des input<>(). Attention : les input sont en lecture seule. Si le composant modifiait la valeur des @Input(), il faut donc stocker la valeur de l'input dans une variable au moment où on la remplace.
Pour faciliter la compréhension du code, les variables ont des noms pertinents et sont toutes typées. Il en va de même pour les méthodes. 

Les composants principaux sont définis dans le répertoire **app**. Toutes les popups sont dans le sous-répertoire **alertes**. Les composants enfants sont dans le sous-répertoire **parts**. La philosophie globale du code est de réutiliser au maximum les éléments (variables, méthodes, composants). 
Tous les labels sont définis dans une classe **Labels** placée dans le répertoire **utils**. Pour récupérer tous les labels, il suffit de créer une nouvelle instance de la classe et de l’utiliser dans le template. Attention à l’importation de la classe : bien choisir la classe du projet car il existe une classe Angular homonyme.
Pour la mise en forme, le module **Material** est utilisé, couplé à **Bootstrap**. Un thème personnalisé a été défini dans le répertoire **styles**.

<h3>Ce qui est « normal »</h3>

Au lancement de l’application, apparaissent de nombreuses erreurs dans la console liées à des fichiers javascript, mais elles n’ont pas l’air d’avoir d’impact sur le bon fonctionnement de l’application. 


