import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from './add-tutorial.component';

describe('AddTutorialComponent', () => {
  let component: AddTutorialComponent;
  let fixture: ComponentFixture<AddTutorialComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTutorialComponent],
      imports: [HttpClientTestingModule, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTutorialComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock
      .expectOne('/categories')
      .flush([{ id: 7, name: 'Frontend' }, { id: 8, name: 'Backend' }]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the form inside a card', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.submit-form.tm-card')).not.toBeNull();
    expect(compiled.querySelector('#title')).not.toBeNull();
    expect(compiled.querySelector('#description')).not.toBeNull();
  });

  it('offers the loaded categories in the dropdown', () => {
    const options: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('#category option')
    );

    expect(options.length).toBe(3);
    expect(options[1].textContent).toContain('Frontend');
  });

  it('posts the selected categoryId', () => {
    component.tutorial.title = 'Angular';
    component.tutorial.description = 'desc';
    component.tutorial.categoryId = 8;
    component.saveTutorial();

    const req = httpMock.expectOne('/tutorials');
    expect(req.request.body.categoryId).toBe(8);
    req.flush({ id: 1 });

    expect(component.submitted).toBeTrue();
  });

  it('shows a success alert once submitted', () => {
    component.submitted = true;
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert.alert-success');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('successfully');
  });
});
