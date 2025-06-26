# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ancrage is a territorial diagnostic application with a Flask/Python backend and Angular 19 frontend. It helps analyze territorial anchoring through interviews, site visits, and data visualization.

## Technology Stack

### Backend (Python/Flask)
- **Framework**: Flask 2.2.5 with SQLAlchemy and PostgreSQL
- **Database**: PostgreSQL with GeoAlchemy2 for geographic data
- **Authentication**: Flask-Login with Authlib
- **Migration**: Flask-Migrate with Alembic
- **Location**: `/backend/` directory

### Frontend (Angular 19)
- **Framework**: Angular 19 with standalone components
- **UI Libraries**: Angular Material + Bootstrap 5.3
- **Mapping**: Leaflet with ngx-leaflet and marker clustering
- **Charts**: Chart.js with ng2-charts
- **Notifications**: ngx-toastr
- **Location**: `/frontend/` directory

## Development Commands

### Frontend Commands
```bash
cd frontend
npm install                    # Install dependencies
npm start                     # Start dev server (ng serve)
npm run build                 # Build for production
npm test                      # Run unit tests with Karma
```

### Backend Commands
```bash
cd backend
pip install -r requirements.txt           # Install dependencies
flask db migrate -m "migration message"   # Create migration (if models changed)
flask db upgrade                          # Apply migrations
python feed_database.py                   # Load initial data
python questions.py                       # Load questions if modified
python run.py                            # Start Flask dev server
```

### Initial Setup Requirements
1. Install Flask-UUID: `pip install Flask-UUID`
2. Install Slugify: `pip install slugify`
3. Create log directory: `mkdir /var/log/ancrage && sudo chown $USER:$USER /var/log/ancrage && sudo chmod 755 /var/log/ancrage`
4. Import SQL scripts for communes, départements, régions (first migration only)

## Architecture & Code Patterns

### Angular 19 Specific Patterns

**Standalone Components**: All components are standalone by default
```typescript
@Component({
  selector: 'app-component',
  templateUrl: './component.html',
  styleUrls: ['./component.css'],
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule]
})
```

**Service Injection**: Use `inject()` function instead of constructor injection
```typescript
private siteService = inject(SiteService);
```

**Signals**: Replace most variables with signals
```typescript
diagnostic = signal<Diagnostic>(new Diagnostic());
// Access with: this.diagnostic()
```

**Effect Instead of Lifecycle Hooks**: Use `effect()` in constructor instead of ngOnInit
```typescript
constructor() {
  effect(() => {
    // Reactive logic here
  });
}
```

**Input Signals**: Replace @Input() with input<>()
```typescript
// Old: @Input() data: any;
// New: data = input<any>();
```

### Model Pattern (TypeScript)
Every model must implement three methods:
- `copy()`: Deep copy of the object
- `static fromJson(data: Interface)`: Create instance from API response
- `toJson()`: Serialize for API calls

### Backend Structure
- **Models**: `/backend/models/models.py` - All SQLAlchemy models
- **Routes**: `/backend/routes/` - Blueprint-based routes by model
- **Logs**: Stored in `/var/log/ancrage/`

### Frontend Structure
- **Components**: `/frontend/src/app/components/` - Main components
- **Alerts**: `/frontend/src/app/components/alertes/` - Modal dialogs
- **Parts**: `/frontend/src/app/components/parts/` - Reusable child components
- **Models**: `/frontend/src/app/models/` - TypeScript models with interfaces
- **Services**: `/frontend/src/app/services/` - API communication
- **Utils**: `/frontend/src/app/utils/` - Labels class and utilities

### Key Libraries Usage
- **Leaflet**: Interactive maps with marker clustering
- **Chart.js**: Data visualization and statistics
- **Angular Material**: UI components with custom theme in `/styles/`
- **Bootstrap**: Layout and styling utilities
- **Moment.js**: Date handling with French locale

## Database & Migrations

The application uses PostgreSQL with geographic extensions. When models change:
1. Run migration: `flask db migrate -m "description"`
2. Apply changes: `flask db upgrade`
3. Update latitude/longitude if needed with provided SQL query

## Important Notes

- The app is designed for Linux environments (use WSL on Windows)
- Console errors from JavaScript files are normal and don't affect functionality
- All labels are centralized in the Labels class (`/frontend/src/app/utils/labels.ts`)
- Components use forkJoin for multiple simultaneous API calls
- Subscriptions must be manually destroyed in ngOnDestroy when not using signals