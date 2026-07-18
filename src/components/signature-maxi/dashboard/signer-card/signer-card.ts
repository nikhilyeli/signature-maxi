import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Signer } from '../../core/signer.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-signer-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './signer-card.html',
  styleUrls: ['./signer-card.scss']
})
export class SignerCardComponent {
  @Input() signer!: Signer;
  @Output() view = new EventEmitter<Signer>();
  @Output() sign = new EventEmitter<Signer>();
  @Output() delete = new EventEmitter<Signer>();

  constructor(private sanitizer: DomSanitizer) {}

  get signatureImageSrc(): SafeUrl | null {
    if (!this.signer?.signatureDataUrl) return null;
    return this.sanitizer.bypassSecurityTrustUrl(this.signer.signatureDataUrl);
  }
}
