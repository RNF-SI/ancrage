import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StateService } from './state.service';
import { Diagnostic } from '@app/models/diagnostic.model';

describe('StateService', () => {
  let service: StateService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl'], {
      url: '/test-current-url'
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(StateService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Diagnostic Management', () => {
    it('should set and get current diagnostic', () => {
      const testDiagnostic = new Diagnostic();
      testDiagnostic.id_diagnostic = 123;
      testDiagnostic.nom = 'Test Diagnostic';

      service.setDiagnostic(testDiagnostic);

      expect(service.getCurrentDiagnostic()).toEqual(testDiagnostic);
    });

    it('should persist diagnostic to localStorage', () => {
      const testDiagnostic = new Diagnostic();
      testDiagnostic.id_diagnostic = 456;
      testDiagnostic.nom = 'Persisted Diagnostic';

      service.setDiagnostic(testDiagnostic);

      const stored = JSON.parse(localStorage.getItem('diagnostic')!);
      expect(stored.id_diagnostic).toBe(456);
      expect(stored.nom).toBe('Persisted Diagnostic');
    });

    it('should update diagnostic properties', () => {
      const testDiagnostic = new Diagnostic();
      testDiagnostic.id_diagnostic = 789;
      testDiagnostic.nom = 'Original Name';

      service.setDiagnostic(testDiagnostic);
      service.updateDiagnostic({ nom: 'Updated Name' });

      const current = service.getCurrentDiagnostic();
      expect(current?.nom).toBe('Updated Name');
      expect(current?.id_diagnostic).toBe(789);
    });

    it('should handle null diagnostic gracefully', () => {
      service.setDiagnostic(null);
      expect(service.getCurrentDiagnostic()).toBeNull();
      expect(localStorage.getItem('diagnostic')).toBeNull();
    });
  });

  describe('Navigation Management', () => {
    it('should set and get previous page', () => {
      const testUrl = '/previous-page';
      
      service.setPreviousPage(testUrl);
      
      expect(service.getCurrentPreviousPage()).toBe(testUrl);
    });

    it('should persist previous page to localStorage', () => {
      const testUrl = '/test-page';
      
      service.setPreviousPage(testUrl);
      
      expect(localStorage.getItem('previousPage')).toBe(JSON.stringify(testUrl));
    });

    it('should navigate with state correctly', () => {
      const testDiagnostic = new Diagnostic();
      testDiagnostic.nom = 'Navigation Test';
      
      service.navigateWithState(['/test-route'], testDiagnostic);
      
      expect(service.getCurrentDiagnostic()).toEqual(testDiagnostic);
      expect(service.getCurrentPreviousPage()).toBe('/test-current-url');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route']);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      // Simulate corrupted JSON in localStorage
      localStorage.setItem('diagnostic', 'invalid-json{{{');
      
      // Create a new service instance to trigger initialization
      const newService = new StateService(mockRouter);
      
      expect(newService.getCurrentDiagnostic()).toBeNull();
      expect(localStorage.getItem('diagnostic')).toBeNull(); // Should be cleaned
    });

    it('should handle localStorage quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      spyOn(localStorage, 'setItem').and.throwError(new DOMException('Quota exceeded', 'QuotaExceededError'));
      
      const testDiagnostic = new Diagnostic();
      
      expect(() => service.setDiagnostic(testDiagnostic)).not.toThrow();
      expect(service.getCurrentDiagnostic()).toEqual(testDiagnostic);
    });
  });

  describe('State Clearing', () => {
    it('should clear all state', () => {
      const testDiagnostic = new Diagnostic();
      service.setDiagnostic(testDiagnostic);
      service.setPreviousPage('/test');
      service.setPageDiagnostic('/diagnostic-page');
      
      service.clearAll();
      
      expect(service.getCurrentDiagnostic()).toBeNull();
      expect(service.getCurrentPreviousPage()).toBe('');
      expect(service.getCurrentPageDiagnostic()).toBe('');
      expect(localStorage.getItem('diagnostic')).toBeNull();
      expect(localStorage.getItem('previousPage')).toBeNull();
      expect(localStorage.getItem('pageDiagnostic')).toBeNull();
    });

    it('should check if diagnostic exists', () => {
      expect(service.hasDiagnostic()).toBeFalse();
      
      service.setDiagnostic(new Diagnostic());
      expect(service.hasDiagnostic()).toBeTrue();
      
      service.clearDiagnostic();
      expect(service.hasDiagnostic()).toBeFalse();
    });
  });

  describe('Observable State', () => {
    it('should emit diagnostic changes', (done) => {
      const testDiagnostic = new Diagnostic();
      testDiagnostic.nom = 'Observable Test';
      
      service.diagnostic$.subscribe(diagnostic => {
        if (diagnostic) {
          expect(diagnostic.nom).toBe('Observable Test');
          done();
        }
      });
      
      service.setDiagnostic(testDiagnostic);
    });
  });
});