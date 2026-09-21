import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/** Scene durations, ms — mirrors the standalone reel artifact's timeline exactly. */
const DURATIONS = [4500, 4000, 6000, 7000, 7500, 7000, 7500, 5500, 5500, 5000, 4000];

/** Index of the light/dark scene, whose theme card toggles on a timer while active. */
const THEME_SCENE = 8;

@Component({
  selector: 'app-product-reel',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './product-reel.html',
  styleUrls: ['./product-reel.scss'],
})
export class ProductReelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rail', { static: true }) private railRef!: ElementRef<HTMLDivElement>;
  @ViewChild('railFill', { static: true }) private railFillRef!: ElementRef<HTMLDivElement>;
  @ViewChild('timeNowEl', { static: true }) private timeNowRef!: ElementRef<HTMLSpanElement>;
  @ViewChild('themeCard') private themeCardRef?: ElementRef<HTMLDivElement>;
  @ViewChild('themeToggle') private themeToggleRef?: ElementRef<HTMLDivElement>;

  readonly durations = DURATIONS;
  private readonly total = DURATIONS.reduce((a, b) => a + b, 0);
  private readonly offsets: number[] = (() => {
    const o: number[] = [];
    let acc = 0;
    for (const d of DURATIONS) {
      o.push(acc);
      acc += d;
    }
    return o;
  })();

  current = 0;
  playing: boolean;
  readonly timeTotalLabel = this.fmt(this.total);

  private scenes: HTMLElement[] = [];
  private pausedElapsed = 0;
  private playStart = performance.now();
  private rafId: number | null = null;
  private themeInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const reduceMotion =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.playing = !reduceMotion;
  }

  ngAfterViewInit(): void {
    this.scenes = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>('.scene'));
    this.playStart = performance.now();
    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.tick);
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.themeInterval !== null) clearInterval(this.themeInterval);
  }

  togglePlay(): void {
    this.setPlaying(!this.playing);
  }

  seekToScene(i: number): void {
    this.seek(this.offsets[i]);
  }

  onRailClick(ev: MouseEvent): void {
    const rect = this.railRef.nativeElement.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
    this.seek(pct * this.total);
  }

  /* ── Private ─────────────────────────────────────────────────────────── */

  private setPlaying(p: boolean): void {
    if (p === this.playing) return;
    if (p) {
      this.playStart = performance.now();
    } else {
      this.pausedElapsed = this.elapsedNow();
    }
    this.playing = p;
  }

  private seek(ms: number): void {
    this.pausedElapsed = ((ms % this.total) + this.total) % this.total;
    this.playStart = performance.now();
    this.setActive(this.indexFor(this.pausedElapsed));
  }

  private elapsedNow(): number {
    const e = this.playing ? this.pausedElapsed + (performance.now() - this.playStart) : this.pausedElapsed;
    return e % this.total;
  }

  private indexFor(elapsed: number): number {
    for (let i = this.offsets.length - 1; i >= 0; i--) {
      if (elapsed >= this.offsets[i]) return i;
    }
    return 0;
  }

  private setActive(i: number): void {
    if (i === this.current || this.scenes.length === 0) return;
    this.exitScene(this.current);
    this.scenes[this.current]?.classList.remove('is-active');
    this.current = i;
    this.scenes[this.current]?.classList.add('is-active');
    this.enterScene(this.current);
    this.cdr.detectChanges();
  }

  private enterScene(i: number): void {
    if (i === THEME_SCENE) {
      this.themeInterval = setInterval(() => {
        this.themeCardRef?.nativeElement.classList.toggle('dark');
        this.themeToggleRef?.nativeElement.classList.toggle('dark');
      }, 2200);
    }
  }

  private exitScene(i: number): void {
    if (i === THEME_SCENE && this.themeInterval !== null) {
      clearInterval(this.themeInterval);
      this.themeInterval = null;
      this.themeCardRef?.nativeElement.classList.remove('dark');
      this.themeToggleRef?.nativeElement.classList.remove('dark');
    }
  }

  private fmt(ms: number): string {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + (s % 60).toString().padStart(2, '0');
  }

  /**
   * A single elapsed-time clock (not a chain of setTimeouts) drives which scene is
   * active — a throttled/backgrounded tab just recomputes the right scene from
   * elapsed time on its next frame instead of firing a backlog of stacked advances.
   */
  private tick = (): void => {
    const e = this.elapsedNow();
    const idx = this.indexFor(e);
    if (idx !== this.current) {
      this.zone.run(() => this.setActive(idx));
    }
    this.railFillRef.nativeElement.style.width = (e / this.total) * 100 + '%';
    this.timeNowRef.nativeElement.textContent = this.fmt(e);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
