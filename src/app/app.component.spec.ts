import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [
        AppComponent,
        HeaderComponent
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Angular 17 Crud example'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Angular 17 Crud example');
  });

  it('should render the header and the footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    httpMock.expectOne('/health').flush({ status: 'ok' });

    expect(compiled.querySelector('app-header .tm-navbar')).not.toBeNull();
    expect(compiled.querySelector('.app-footer')?.textContent).toContain(
      'Tutorial Manager'
    );
  });

  it('should show a loading indicator while the health check is in progress', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const health = compiled.querySelector('.app-footer-health');
    expect(health?.querySelector('.app-footer-health-spinner')).not.toBeNull();
    expect(health?.classList).toContain('is-loading');
    expect(health?.classList).not.toContain('is-ok');
    expect(health?.classList).not.toContain('is-error');

    httpMock.expectOne('/health').flush({ status: 'ok' });
  });

  it('should hide the loading indicator and mark the status as ok once the check succeeds', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    httpMock.expectOne('/health').flush({ status: 'ok' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const health = compiled.querySelector('.app-footer-health');
    expect(health?.querySelector('.app-footer-health-spinner')).toBeNull();
    expect(health?.classList).toContain('is-ok');
    expect(health?.classList).not.toContain('is-loading');
  });

  it('should hide the loading indicator and mark the status as an error once the check fails', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    httpMock
      .expectOne('/health')
      .flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const health = compiled.querySelector('.app-footer-health');
    expect(health?.querySelector('.app-footer-health-spinner')).toBeNull();
    expect(health?.classList).toContain('is-error');
    expect(health?.classList).not.toContain('is-loading');
  });

  it('should show the API health status in the footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    httpMock.expectOne('/health').flush({ status: 'ok' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-footer-health')?.textContent).toContain(
      'API: ok'
    );
  });

  it('should show the API as unavailable when the health call fails', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    httpMock
      .expectOne('/health')
      .flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-footer-health')?.textContent).toContain(
      'API: unavailable'
    );
  });
});
