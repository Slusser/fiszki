import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SessionService } from './core/auth/session.service';

describe('App', () => {
  const sessionServiceMock = {
    init: jasmine.createSpy('init').and.resolveTo(),
  };

  beforeEach(async () => {
    sessionServiceMock.init.calls.reset();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: SessionService, useValue: sessionServiceMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
