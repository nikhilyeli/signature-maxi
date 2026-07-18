import { NgModule } from '@angular/core';

// Components & Services
import { SignatureMaxiComponent } from './signature-maxi/dashboard/signature-maxi/signature-maxi';
import { SignatureMaxiService } from './signature-maxi/core/signature-maxi.service';

@NgModule({
  imports: [SignatureMaxiComponent],
  providers: [SignatureMaxiService],
  exports: [
    SignatureMaxiComponent, // Exposes the component so other modules can use <app-signature-maxi>
  ],
})
export class SignatureModule {}
