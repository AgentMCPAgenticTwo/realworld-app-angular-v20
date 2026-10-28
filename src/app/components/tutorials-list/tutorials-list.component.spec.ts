import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from './tutorials-list.component';
import { TutorialDrawerComponent } from '../tutorial-drawer/tutorial-drawer.component';

describe('TutorialsListComponent', () => {
  let component: TutorialsListComponent;
  let fixture: ComponentFixture<TutorialsListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/tutorials').flush([
      { id: 1, title: 'Angular', description: 'desc', published: false }
    ]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the drawer when a tutorial is clicked', () => {
    const item: HTMLElement =
      fixture.nativeElement.querySelector('.list-group-item');
    item.click();
    fixture.detectChanges();

    expect(component.drawerTutorialId).toBe(1);
    httpMock.expectOne('/tutorials/1').flush({
      id: 1,
      title: 'Angular',
      description: 'desc',
      published: false
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.drawer')).not.toBeNull();
  });

  it('closes the drawer', () => {
    component.setActiveTutorial({ id: 1 }, 0);
    fixture.detectChanges();
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'Angular' });

    component.closeDrawer();
    fixture.detectChanges();

    expect(component.drawerTutorialId).toBeNull();
    expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();
  });
});
