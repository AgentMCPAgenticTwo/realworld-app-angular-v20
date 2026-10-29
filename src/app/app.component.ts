import { Component, OnInit } from '@angular/core';
import { HealthService } from './services/health.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Angular 17 Crud example';
  apiStatus = 'unknown';

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.healthService.get().subscribe({
      next: (health) => {
        this.apiStatus = health.status || 'unknown';
      },
      error: () => {
        this.apiStatus = 'unavailable';
      },
    });
  }
}
