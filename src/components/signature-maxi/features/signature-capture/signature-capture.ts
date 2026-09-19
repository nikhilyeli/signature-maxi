import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  NgxSignatureOptions,
  NgxSignaturePadComponent,
  NgxSignaturePadModule,
} from '@eve-sama/ngx-signature-pad';
import { Subject, switchMap, timer } from 'rxjs';
import SignaturePad from 'signature_pad';
import { SignatureHelper } from '../../core/signature-maxi.helper';
import { Signer } from '../../core/signer.interface';

export type SignatureCanvasSize = 'small' | 'medium' | 'large';

export interface SignatureCaptureConfig {
  /** Enable the draw-on-canvas tab */
  enableDraw?: boolean;
  /** Enable the handwritten-font type tab */
  enableType?: boolean;
  /** Enable the file upload / camera capture tab */
  enableUpload?: boolean;
  /** Canvas background colour (default white) */
  canvasBackground?: string;
  /** Pen colour for draw mode */
  penColor?: string;
  /** Auto-dismiss status after this many ms (errors only) */
  saveStatusDuration?: number;
  /** Use the legacy signature_pad instead of ngx-signature-pad */
  useLegacyDraw?: boolean;
  /** Canvas dimensions (9:4 aspect ratio) */
  canvasSize?: SignatureCanvasSize; // 'small' | 'medium' | 'large'
}

export const DEFAULT_CAPTURE_CONFIG: Required<SignatureCaptureConfig> = {
  enableDraw: true,
  enableType: true,
  enableUpload: true,
  canvasBackground: 'rgb(255,255,255)',
  penColor: '#000000',
  saveStatusDuration: 1500,
  useLegacyDraw: false,
  canvasSize: 'small',
};

/** System fonts available on all major OS / browsers — no Google Fonts download needed */
export const SYSTEM_FONT_OPTIONS = [
  {
    label: 'Script',
    value: '"Segoe Script", "Brush Script MT", "Bradley Hand", cursive',
    preview: 'Aa',
  },
  { label: 'Italic', value: 'Georgia, "Times New Roman", Times, serif', preview: 'Aa' },
  {
    label: 'Palatino',
    value: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
    preview: 'Aa',
  },
  { label: 'Cursive', value: '"Comic Sans MS", "Comic Sans", cursive', preview: 'Aa' },
  {
    label: 'Garamond',
    value: 'Garamond, "EB Garamond", "Cormorant Garamond", serif',
    preview: 'Aa',
  },
];

@Component({
  selector: 'app-signature-capture',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    NgxSignaturePadModule,
  ],
  templateUrl: './signature-capture.html',
  styleUrls: ['./signature-capture.scss'],
})
export class SignatureCaptureComponent implements AfterViewInit, OnDestroy, OnChanges {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  @Input() contentId = 'default';
  @Input() signer: Signer | null = null;
  @Input() config: SignatureCaptureConfig = {};

  // ── Outputs ─────────────────────────────────────────────────────────────────
  @Output() signatureConfirmed = new EventEmitter<{
    watermarked: string;
    raw: string;
    omitSignerName?: boolean;
  }>();
  @Output() signatureCleared = new EventEmitter<void>();

  // ── ViewChild ───────────────────────────────────────────────────────────────
  @ViewChild('drawCanvas', { static: false }) drawCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ngxPad') ngxSignaturePad?: NgxSignaturePadComponent;
  @ViewChild('padContainer', { static: false }) padContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('cameraVideo', { static: false }) cameraVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;

  // ── State ────────────────────────────────────────────────────────────────────
  cfg!: Required<SignatureCaptureConfig>;
  selectedTabIndex = 0;
  /** Pre-filled with the signer's name; user can override */
  typedName = '';
  selectedFont = SYSTEM_FONT_OPTIONS[0].value;
  uploadPreview: string | null = null;
  isDragOver = false;
  saveStatus: 'success' | 'error' | null = null;
  locked = false;

  private _calculatedWidth = 450;
  private _calculatedHeight = 200;

  get baseCanvasWidth(): number {
    if (this.cfg.canvasSize === 'large') return 1350;
    if (this.cfg.canvasSize === 'medium') return 900;
    return 450; // 'small'
  }

  get baseCanvasHeight(): number {
    if (this.cfg.canvasSize === 'large') return 600;
    if (this.cfg.canvasSize === 'medium') return 400;
    return 200; // 'small'
  }

  get canvasWidth(): number {
    return this._calculatedWidth;
  }

  get canvasHeight(): number {
    return this._calculatedHeight;
  }

  ngxOptions: NgxSignatureOptions = {
    width: 450,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0)',
    penColor: 'black',
  };

  signaturePad!: SignaturePad;
  readonly fontOptions = SYSTEM_FONT_OPTIONS;

  private saveStatusShown$ = new Subject<void>();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly snackBar: MatSnackBar,
    private readonly zone: NgZone,
  ) {
    this.saveStatusShown$
      .pipe(
        switchMap(() => timer(this.cfg?.saveStatusDuration ?? 1500)),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.saveStatus = null;
        this.cdr.detectChanges();
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateCanvasDimensions();
  }

  updateCanvasDimensions(): void {
    if (!this.cfg) return;

    let maxWidth = this.padContainer?.nativeElement?.parentElement?.clientWidth;
    if (!maxWidth || maxWidth <= 0) {
      maxWidth = Math.min(window.innerWidth - 48, 800);
    }

    const baseW = this.baseCanvasWidth;
    const baseH = this.baseCanvasHeight;
    const aspectRatio = baseW / baseH;

    const targetWidth = Math.min(baseW, maxWidth);
    const targetHeight = Math.round(targetWidth / aspectRatio);

    this._calculatedWidth = targetWidth;
    this._calculatedHeight = targetHeight;

    this.ngxOptions = {
      ...this.ngxOptions,
      width: this._calculatedWidth,
      height: this._calculatedHeight,
      backgroundColor: 'rgba(0,0,0,0)',
      penColor: this.cfg.penColor,
    };

    if (this.cfg.useLegacyDraw) {
      this.initPad();
    }

    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.cfg = { ...DEFAULT_CAPTURE_CONFIG, ...this.config };

    setTimeout(() => {
      this.updateCanvasDimensions();
    }, 0);

    const signerChange = changes['signer'];
    if (signerChange) {
      const prev: Signer | null = signerChange.previousValue ?? null;
      const curr: Signer | null = signerChange.currentValue ?? null;
      if (prev?.id !== curr?.id) {
        this.resetPadState();
        // Auto-prefill the signer's name into the type tab
        if (curr?.name) this.typedName = curr.name;
      } else if (prev?.signed && curr && !curr.signed) {
        this.resetPadState();
        if (curr?.name) this.typedName = curr.name;
      }
    }
  }

  ngAfterViewInit(): void {
    this.cfg = { ...DEFAULT_CAPTURE_CONFIG, ...this.config };
    // Prefill name on first load
    if (this.signer?.name) this.typedName = this.signer.name;
    if (this.cfg.enableDraw) {
      setTimeout(() => {
        this.updateCanvasDimensions();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Component cleanup
  }

  // ── Tab ──────────────────────────────────────────────────────────────────────
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 0 && this.cfg.enableDraw) {
      setTimeout(() => {
        this.updateCanvasDimensions();
      }, 100);
    }
  }

  // ── Draw ─────────────────────────────────────────────────────────────────────
  private initPad(): void {
    const canvas = this.drawCanvas?.nativeElement;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    if (this.signaturePad) {
      this.signaturePad.off();
    }
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(0,0,0,0)',
      penColor: this.cfg.penColor,
      minWidth: 1.5,
      maxWidth: 3,
    });
  }

  confirmDraw(): void {
    if (!this.signer) return;

    let svgXml: string | null = '';

    if (this.cfg.useLegacyDraw) {
      if (!this.signaturePad || this.signaturePad.isEmpty()) return;
      svgXml = SignatureHelper.toSvgXml(
        this.signaturePad.toDataURL('image/svg+xml') ?? '',
        this.canvasWidth,
        this.canvasHeight,
      );
    } else {
      if (!this.ngxSignaturePad || this.ngxSignaturePad.isEmpty()) return;
      // Get SVG from ngx-signature-pad
      svgXml = SignatureHelper.toSvgXml(
        this.ngxSignaturePad.toDataURL('image/svg+xml') ?? '',
        this.canvasWidth,
        this.canvasHeight,
      );
    }

    try {
      if (!svgXml) throw new Error('SVG empty');
      // Pass null for watermarked so the dialog handles it, or pass raw for both
      this._emit(svgXml, svgXml);
    } catch {
      if (this.cfg.useLegacyDraw) {
        this.signaturePad?.clear();
      } else {
        this.ngxSignaturePad?.clear();
      }
      this.showStatus('error');
    }
  }

  clearDraw(): void {
    this.clearSignature();
  }

  clearSignature(): void {
    if (!this.signer) return;
    this.signatureCleared.emit();
    this.signer = {
      ...this.signer,
      signed: false,
      signature: null,
      signatureSvg: null,
      signatureWatermarkedSvg: null,
      signatureDataUrl: undefined,
    };
    this.resetPadState();
    if (this.ngxSignaturePad) this.ngxSignaturePad.clear();
    if (this.signer?.name) this.typedName = this.signer.name;
    // Re-initialize pad after a tick because the tab reappears
    if (this.cfg.useLegacyDraw) setTimeout(() => this.initPad(), 50);
  }

  // ── Type ─────────────────────────────────────────────────────────────────────
  get typedPreview(): string {
    return this.typedName.trim() || this.signer?.name || 'Your Signature';
  }

  confirmTyped(): void {
    if (!this.signer || !this.typedName.trim()) return;
    try {
      const svgXml = SignatureHelper.generateTypedSvg(
        this.typedName,
        this.selectedFont,
        this.canvasWidth,
        this.canvasHeight,
      );
      this._emit(svgXml, svgXml, true);
    } catch {
      this.showStatus('error');
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────────
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  }
  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) this.loadFile(file);
  }

  onFileInput(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.loadFile(f);
    (e.target as HTMLInputElement).value = '';
  }

  private async loadFile(file: File): Promise<void> {
    const rawDataUrl = await SignatureHelper.readFileAsDataUrl(file);
    // Compress image to ensure it's lightweight (< 1MB equivalent footprint)
    this.uploadPreview = await this.compressImage(rawDataUrl, this.canvasWidth, this.canvasHeight);
    this.cdr.detectChanges();
  }

  private compressImage(
    dataUrl: string,
    targetWidth: number,
    targetHeight: number,
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background to avoid transparent-to-black png issues when compressing to jpeg
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          // Scale to fit or cover
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const x = targetWidth / 2 - (img.width / 2) * scale;
          const y = targetHeight / 2 - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // 0.8 quality jpeg is very lightweight
      };
      img.src = dataUrl;
    });
  }

  async startCamera(): Promise<void> {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      this.cameraInput?.nativeElement.click();
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === 'videoinput');
      
      if (!hasCamera) {
        this.zone.run(() => {
          this.snackBar.open('No camera found on this device. Please upload an image instead.', 'OK', { duration: 4000 });
        });
        return;
      }
      
      this.cameraInput?.nativeElement.click();
    } catch (err) {
      this.zone.run(() => {
        this.snackBar.open('Camera permission denied or not supported.', 'OK', { duration: 4000 });
      });
    }
  }

  confirmUpload(): void {
    if (!this.signer || !this.uploadPreview) return;
    try {
      const svgXml = SignatureHelper.imageToSvg(
        this.uploadPreview,
        this.canvasWidth,
        this.canvasHeight,
      );
      this._emit(svgXml, svgXml);
    } catch {
      this.showStatus('error');
    }
  }

  clearUpload(): void {
    this.uploadPreview = null;
    this.cdr.detectChanges();
  }

  // ── Shared ────────────────────────────────────────────────────────────────────
  private _emit(watermarked: string, raw: string, omitSignerName?: boolean): void {
    this.locked = true;
    this.showStatus('success');
    this.signatureConfirmed.emit({ watermarked, raw, omitSignerName });
  }

  private showStatus(status: 'success' | 'error'): void {
    this.saveStatus = status;
    if (status === 'error') this.saveStatusShown$.next();
  }

  private resetPadState(): void {
    this.signaturePad?.clear();
    // Sometimes the ngxSignaturePad might be rebuilding, so delay the clear slightly
    setTimeout(() => {
      this.ngxSignaturePad?.clear();
    }, 50);
    this.saveStatus = null;
    this.locked = false;
    this.uploadPreview = null;
    this.typedName = '';
  }
}
