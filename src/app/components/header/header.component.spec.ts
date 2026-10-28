import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the brand and the navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.tm-brand')?.textContent).toContain(
      'Tutorial Manager'
    );

    const links = Array.from(
      compiled.querySelectorAll('.tm-nav-link')
    ).map((el) => el.textContent?.trim());
    expect(links).toEqual(['Tutorials', 'Add Tutorial']);
  });
});
