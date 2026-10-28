import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Tutorial } from '../../models/tutorial.model';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-tutorial-drawer',
  templateUrl: './tutorial-drawer.component.html',
  styleUrls: ['./tutorial-drawer.component.css'],
})
export class TutorialDrawerComponent implements OnChanges {
  @Input() tutorialId: any = null;

  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  currentTutorial: Tutorial = {};
  notFound = false;
  message = '';

  constructor(private tutorialService: TutorialService) {}

  get open(): boolean {
    return this.tutorialId !== null && this.tutorialId !== undefined;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tutorialId']) {
      this.currentTutorial = {};
      this.notFound = false;
      this.message = '';

      if (this.open) {
        this.getTutorial(this.tutorialId);
      }
    }
  }

  getTutorial(id: any): void {
    this.tutorialService.get(id).subscribe({
      next: (data) => {
        this.currentTutorial = data;
        this.notFound = false;
      },
      error: (e: HttpErrorResponse) => {
        if (e.status === 404) {
          this.currentTutorial = {};
          this.notFound = true;
        } else {
          console.error(e);
        }
      }
    });
  }

  updatePublished(status: boolean): void {
    const data = {
      title: this.currentTutorial.title,
      description: this.currentTutorial.description,
      published: status
    };

    this.message = '';

    this.tutorialService.update(this.currentTutorial.id, data).subscribe({
      next: (res) => {
        this.currentTutorial.published = status;
        this.message = res && res.message
          ? res.message
          : 'The status was updated successfully!';
        this.changed.emit();
      },
      error: (e) => console.error(e)
    });
  }

  deleteTutorial(): void {
    this.tutorialService.delete(this.currentTutorial.id).subscribe({
      next: () => {
        this.changed.emit();
        this.close();
      },
      error: (e) => console.error(e)
    });
  }

  close(): void {
    this.closed.emit();
  }
}
