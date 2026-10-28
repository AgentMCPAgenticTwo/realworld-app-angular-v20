import { Component, OnInit } from '@angular/core';
import { Category } from '../../models/category.model';
import { Tutorial } from '../../models/tutorial.model';
import { CategoryService } from '../../services/category.service';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-tutorials-list',
  templateUrl: './tutorials-list.component.html',
  styleUrls: ['./tutorials-list.component.css'],
})
export class TutorialsListComponent implements OnInit {
  tutorials?: Tutorial[];
  filteredTutorials?: Tutorial[];
  categories: Category[] = [];
  currentTutorial: Tutorial = {};
  currentIndex = -1;
  title = '';
  categoryId: any = null;
  drawerTutorialId: any = null;

  constructor(
    private tutorialService: TutorialService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.retrieveTutorials();
    this.retrieveCategories();
  }

  retrieveTutorials(): void {
    this.tutorialService.getAll().subscribe({
      next: (data) => {
        this.tutorials = data;
        this.applyCategoryFilter();
        console.log(data);
      },
      error: (e) => console.error(e)
    });
  }

  retrieveCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (e) => console.error(e)
    });
  }

  applyCategoryFilter(): void {
    if (this.categoryId === null || this.categoryId === undefined) {
      this.filteredTutorials = this.tutorials;
      return;
    }

    this.filteredTutorials = (this.tutorials || []).filter(
      (tutorial) => tutorial.categoryId === this.categoryId
    );
  }

  categoryName(tutorial: Tutorial): string {
    const category = this.categories.find((c) => c.id === tutorial.categoryId);
    return category && category.name ? category.name : '';
  }

  refreshList(): void {
    this.retrieveTutorials();
    this.currentTutorial = {};
    this.currentIndex = -1;
    this.drawerTutorialId = null;
  }

  setActiveTutorial(tutorial: Tutorial, index: number): void {
    this.currentTutorial = tutorial;
    this.currentIndex = index;
    this.drawerTutorialId = tutorial.id;
  }

  closeDrawer(): void {
    this.drawerTutorialId = null;
    this.currentTutorial = {};
    this.currentIndex = -1;
  }

  removeAllTutorials(): void {
    this.tutorialService.deleteAll().subscribe({
      next: (res) => {
        console.log(res);
        this.refreshList();
      },
      error: (e) => console.error(e)
    });
  }

  searchTitle(): void {
    this.currentTutorial = {};
    this.currentIndex = -1;
    this.drawerTutorialId = null;

    this.tutorialService.findByTitle(this.title).subscribe({
      next: (data) => {
        this.tutorials = data;
        this.applyCategoryFilter();
        console.log(data);
      },
      error: (e) => console.error(e)
    });
  }
}
