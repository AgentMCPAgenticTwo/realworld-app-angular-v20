import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialDetailsComponent } from './tutorial-details.component';

describe('TutorialDetailsComponent', () => {
  let component: TutorialDetailsComponent;
  let fixture: ComponentFixture<TutorialDetailsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDetailsComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorialDetailsComponent);
    component = fixture.componentInstance;
    component.viewMode = true;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the tutorial inside a card with a status pill', () => {
    component.currentTutorial = {
      id: 1,
      title: 'Angular',
      description: 'desc',
      published: true
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.view-card.tm-card')).not.toBeNull();
    expect(compiled.querySelector('.tm-pill-published')?.textContent).toContain(
      'Published'
    );
  });

  it('shows the message as a bootstrap alert in edit mode', () => {
    component.viewMode = false;
    component.currentTutorial = {
      id: 1,
      title: 'Angular',
      description: 'desc',
      published: false
    };
    component.message = 'This tutorial was updated successfully!';
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert.alert-success');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('updated successfully');
  });
});
