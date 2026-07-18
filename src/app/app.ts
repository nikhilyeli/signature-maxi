import { Component } from '@angular/core';
// Import the component we created earlier
import { SignatureMaxiComponent } from '../components/signature-maxi/dashboard/signature-maxi/signature-maxi';
// import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet],
//   templateUrl: './app.html',
//   styleUrl: './app.scss',
// })
// export class App {
//   protected readonly title = signal('signature-maxi');
// }
@Component({
  selector: 'app-root',
  standalone: true,
  // Register the Signature component so Angular knows it exists
  imports: [SignatureMaxiComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss', // Note: Angular 17+ uses styleUrl (singular)
})
export class AppComponent {
  title = 'Signature Maxi';
}
