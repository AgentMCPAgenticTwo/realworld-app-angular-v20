import { Component, OnInit } from '@angular/core';
import { Category } from '../../models/category.model';
import { Tutorial } from '../../models/tutorial.model';
import { CategoryService } from '../../services/category.service';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-add-tutorial',
  templateUrl: './add-tutorial.component.html',
  styleUrls: ['./add-tutorial.component.css'],
})
export class AddTutorialComponent implements OnInit {
  tutorial: Tutorial = {
    title: '',
    description: '',
    published: false,
    categoryId: null
  };
  categories: Category[] = [];
  submitted = false;

  constructor(
    private tutorialService: TutorialService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.retrieveCategories();
  }

  retrieveCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (e) => console.error(e)
    });
  }

  saveTutorial(): void {
    const data = {
      title: this.tutorial.title,
      description: this.tutorial.description,
      categoryId: this.tutorial.categoryId ? this.tutorial.categoryId : null
    };

    this.tutorialService.create(data).subscribe({
      next: (res) => {
        console.log(res);
        this.submitted = true;
      },
      error: (e) => console.error(e)
    });
  }

  newTutorial(): void {
    this.submitted = false;
    this.tutorial = {
      title: '',
      description: '',
      published: false,
      categoryId: null
    };
  }
}
