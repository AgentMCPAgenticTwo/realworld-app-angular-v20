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
      {
        id: 1,
        title: 'Angular',
        description: 'desc',
        published: false,
        categoryId: 7
      },
      {
        id: 2,
        title: 'Vue',
        description: 'other',
        published: false,
        categoryId: 8
      }
    ]);
    httpMock
      .expectOne('/categories')
      .flush([{ id: 7, name: 'Frontend' }, { id: 8, name: 'Backend' }]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a card with a status pill for each tutorial', () => {
    const card: HTMLElement =
      fixture.nativeElement.querySelector('.tutorial-card');

    expect(card.querySelector('.tutorial-title')?.textContent).toContain(
      'Angular'
    );
    expect(card.querySelector('.tutorial-description')?.textContent).toContain(
      'desc'
    );
    expect(card.querySelector('.tm-pill-pending')?.textContent).toContain(
      'Pending'
    );
  });

  it('shows the category as a badge on each card', () => {
    const card: HTMLElement =
      fixture.nativeElement.querySelector('.tutorial-card');

    expect(card.querySelector('.tm-pill-category')?.textContent).toContain(
      'Frontend'
    );
  });

  it('filters the list by the selected category', () => {
    component.categoryId = 8;
    component.applyCategoryFilter();
    fixture.detectChanges();

    const titles: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.tutorial-title')
    );
    expect(titles.length).toBe(1);
    expect(titles[0].textContent).toContain('Vue');
  });

  it('offers every category in the filter dropdown', () => {
    const options: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.search-category option')
    );

    expect(options.length).toBe(3);
    expect(options[0].textContent).toContain('All categories');
  });

  it('shows the empty state when there is no tutorial', () => {
    component.tutorials = [];
    component.applyCategoryFilter();
    fixture.detectChanges();

    const empty: HTMLElement = fixture.nativeElement.querySelector('.tm-empty');
    expect(empty).not.toBeNull();
    expect(empty.querySelector('.tm-empty-icon')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tutorial-card')).toBeNull();
  });

  it('opens the drawer when a tutorial is clicked', () => {
    const item: HTMLElement =
      fixture.nativeElement.querySelector('.tutorial-card');
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
