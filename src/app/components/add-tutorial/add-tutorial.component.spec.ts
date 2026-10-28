import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from './add-tutorial.component';

describe('AddTutorialComponent', () => {
  let component: AddTutorialComponent;
  let fixture: ComponentFixture<AddTutorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTutorialComponent],
      imports: [HttpClientTestingModule, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the form inside a card', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.submit-form.tm-card')).not.toBeNull();
    expect(compiled.querySelector('#title')).not.toBeNull();
    expect(compiled.querySelector('#description')).not.toBeNull();
  });

  it('shows a success alert once submitted', () => {
    component.submitted = true;
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert.alert-success');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('successfully');
  });
});
