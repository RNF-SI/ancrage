<h1>Documentation technique ancrage</h1>

L’application comprend deux parties :
-	Une application backend en python avec Flask reliée à une base de données PostGreSQL
-	Une application frontend en typescript et Angular 15
Le fichier readme indique comment installer le projet. 

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
Afin de faciliter la conversion en Angular 19, les composants doivent être « standalone ». 
A la création, il faut indiquer standalone :true.

    @Component({
        selector: 'app-acteur',
        templateUrl: './acteur.component.html',
        styleUrls: ['./acteur.component.css'],
        standalone:true,
        imports:[CommonModule,MatFormFieldModule,ReactiveFormsModule,MatSelectModule,FormsModule,MatInputModule,MatAutocompleteModule,MatButtonModule,MatProgressSpinnerModule]
    })
 et modifier dans le fichier app.module.ts sa déclaration. Ces composants sont déclarés dans la partie imports et non déclarations. 

    'imports: [
        BrowserModule,
        AppRoutingModule,
        CommonModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatIconModule,
        MatMenuModule,
        HttpClientModule,
        MatButtonModule,
        HomeRnfModule,
        RouterModule,
        NgbModule,
        MatDialogModule,
        DiagosticsListeComponent,
        SitesDiagnosticsViewComponent,
        MapComponent,
        MesDiagnosticsComponent,
        SiteComponent,
        AlerteSiteComponent,
        ChoixActeursComponent,
        SiteLsComponent,
        AlerteVisualisationSiteComponent,
        DiagnosticComponent,
        AlerteShowActorDetailsComponent,
        DiagnosticVisualisationComponent,
        ActeurComponent,
        AlerteActeurComponent, 
        AlerteDiagnosticComponent,
        EntretienComponent,
        GraphiquesComponent,
        MenuLateralComponent,
        AlerteStatutEntretienComponent,
        TableauStructuresComponent,
        MotsClesZoneComponent,
        AlerteGroupeMotsClesComponent,
        AlerteMotsClesComponent,
        AlerteDatePublicationComponent,
        ToastrModule.forRoot({
        timeOut: 15000,
        closeButton: true,
        positionClass: 'toast-bottom-right',
        progressBar: true
        }),
    
    ]'
    
Les services doivent être déclarés en variable privée avec la méthode inject().

private siteService = inject(SiteService);

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

        /** Copie profonde de l'objet */
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

        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
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
    export interface IMotCle {
        id_mot_cle:number;
        nom:string;
        reponses?:Reponse[];
        categorie:Nomenclature;
        mots_cles_issus:MotCle[];
        diagnostic:Diagnostic;
        mot_cle_id_groupe?:number;
        is_actif:boolean;
    }

Dans copy :  

 - les variables simples renvoient à this suivi du nom de la variable :
    copy.id_mot_cle = this.id_mot_cle;
 - les variables de type Objet ont ce format. Il faut aussi que cet Objet implémente sa propre méthode copy (ici diagnostic = new Diagnostic()) : 
    copy.diagnostic = this.diagnostic.copy();
 - les variables de type Liste d'objets ont ce format. Il faut aussi que cet Objet implémente sa propre méthode copy (ici reponses:Reponses[]) :
    copy.reponses = this.reponses?.map(r => r.copy()) || [];

Dans fromJson, data est une interface correspondant à la classe modèle (ici IMotCle).
 - pour les variables simples, le format est le suivant :
    mot_cle.id_mot_cle = data.id_mot_cle;
 - pour les variables Objet (ici categorie = new Nomenclature()). L'objet doit avoir sa propre méthode fromJson().
    mot_cle.categorie = Nomenclature.fromJson(data.categorie);
 - pour les variables listes d'objets (ici mots_cles_issus:MotCle[] = []). L'objet de la liste doit avoir sa propre méthode fromJson().
    mot_cle.mots_cles_issus = (data.mots_cles_issus || []).map(mc => MotCle.fromJson(mc));

Dans toJson, il ne faut renseigner que les champs de type Objet ou liste d'objets. Notez le this précédé de points de suspension. Il copie les champs de type number,string ou boolean.
 - le format pour les variables de type liste d'Objets est (ici reponses:Reponse[] = []). L'objet de la liste doit avoir sa propre méthode toJson().
    reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
 - pour les variables de type Objet (ici categorie = new Categorie()). L'objet doit avoir sa propre méthode toJson().
    categorie: this.categorie.toJson(),
    

Chaque modèle est aussi relié à un service. Les méthodes appelant l’API retournent des Observable du modèle renvoyé par l’API. 

    update(mot_cle:MotCle): Observable<MotCle> {
		const route = this.BASE_URL + '/' + mot_cle.id_mot_cle;
	   
		return this.http.put<IMotCle>(route, mot_cle.toJson()).pipe(
		  map(mot_cleJson => MotCle.fromJson(mot_cleJson))
		);
	}

Dans le composant, il faut donc les souscrire pour récupérer l’objet avec la fonction subscribe.Chaque méthode suivie de subscribe est dans une instance Subscription (typée ?Subscription). 

    private routeSubscription?:Subscription;


    this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_actor = params['id_acteur'];  
          this.slug = params['slug'];
          const communes$ = this.communeService.getAll();
          const profils$ = this.nomenclatureService.getAllByType("profil");
          const categories$ = this.nomenclatureService.getAllByType("categorie");
          this.user_id = this.authService.getCurrentUser().id_role;
          /* Modification */
          if (this.id_actor && this.slug) {
            this.title = this.labels.modifyActor;
            const actor$ = this.actorService.get(this.id_actor,this.slug);

            forkJoin([actor$, communes$, profils$,categories$]).subscribe(([actor,communes, profils,categories]) => {
              
              this.actor = actor;
              
              
              this.instructionsWithResults(communes,profils,categories);
              this.actor.categories = (this.actor.categories|| []).map(cat =>
                this.uniqueCategories.find(uc => uc.id_nomenclature === cat.id_nomenclature) || cat
              );
              this.actor.profil = this.uniqueProfiles.find(pfl => pfl.id_nomenclature === this.actor.profil?.id_nomenclature) || this.actor.profil;
              
              this.formGroup.patchValue({
                id_acteur: this.actor.id_acteur,
                nom: this.actor.nom,
                prenom: this.actor.prenom,
                created_by: this.actor.created_by,
                fonction: this.actor.fonction,
                telephone: this.actor.telephone,
                mail: this.actor.mail,
                commune: this.actor.commune,
                profil: this.actor.profil?.id_nomenclature! > 0 ? this.actor.profil : null,
                categories: this.actor.categories,
                structure: this.actor.structure,
                slug: this.actor.slug
              });
              this.isLoading = false; 
            });
          } else {
            /* Création */
            this.title = this.labels.createActor;
            forkJoin([communes$, profils$,categories$]).subscribe(([communes, profils,categories]) => {
              
              this.instructionsWithResults(communes,profils,categories);
              this.isLoading = false; 
            });
          }
    });


Ces Subscription doivent être détruites dans la méthode ngOnDestroy(){}. Il faut donc implémenter OnDestroy sur les composants concernés.

    ngOnDestroy(): void {
        this.routeSubscription?.unsubscribe();
        this.communeSubscription?.unsubscribe();
        this.actorSubscription?.unsubscribe();
    }

Pour faciliter la compréhension du code, les variables ont des noms pertinents et sont toutes typées. Il en va de même pour les méthodes. 

Les composants principaux sont définis dans le répertoire **app**. Toutes les popups sont dans le sous-répertoire **alertes**. Les composants enfants sont dans le sous-répertoire **parts**. La philosophie globale du code est de réutiliser au maximum les éléments (variables, méthodes, composants). 
Tous les labels sont définis dans une classe **Labels** placée dans le répertoire **utils**. Pour récupérer tous les labels, il suffit de créer une nouvelle instance de la classe et de l’utiliser dans le template. Attention à l’importation de la classe : bien choisir la classe du projet car il existe une classe Angular homonyme.
Pour la mise en forme, le module **Material** est utilisé, couplé à **Bootstrap**. Un thème personnalisé a été défini dans le répertoire **styles**.

<h3>Ce qui est « normal »</h3>

Au lancement de l’application, apparaissent de nombreuses erreurs dans la console liées à des fichiers javascript, mais elles n’ont pas l’air d’avoir d’impact sur le bon fonctionnement de l’application. 


