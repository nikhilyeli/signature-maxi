import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { BehaviorSubject, switchMap } from 'rxjs';
import { SignatureMaxiService } from '../../core/signature-maxi.service';
import { Signer } from '../../core/signer.interface';

@Component({
  selector: 'app-signer-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule],
  template: `
    <h6 class="user-list-title">Users</h6>
    <mat-selection-list hideSingleSelectionIndicator [multiple]="false">
      <mat-list-option
        class="signer-option"
        [class.signed]="signer.signed"
        *ngFor="let signer of signers"
        [selected]="signer === selectedSigner"
        (click)="selectSigner(signer)"
      >
        <span matListItemTitle class="list-name">{{ signer.name }}</span>
        <span matListItemLine class="list-meta">
          <span class="list-role">{{ signer.role }}</span>
          <span
            class="list-badge"
            [class.badge-mand]="signer.mandatory"
            [class.badge-opt]="!signer.mandatory"
          >
            {{ signer.mandatory ? 'Required *' : 'Optional' }}
          </span>
        </span>
        <div matListItemMeta class="list-meta-icon">
          <mat-icon class="signed-icon" *ngIf="signer.signed">check_circle</mat-icon>
          <mat-icon class="pending-icon" *ngIf="!signer.signed">check_box_outline_blank</mat-icon>
        </div>
      </mat-list-option>
    </mat-selection-list>
  `,
  styles: [
    `
      .user-list-title {
        border-bottom: 1px solid var(--sig-border-solid, #d0d4e8);
        padding-bottom: 6px;
        margin: 0 0 4px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--sig-text-muted, #6b7080);
      }

      .list-name {
        font-weight: 600;
        font-size: 0.85rem;
      }
      .list-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }
      .list-role {
        font-size: 0.68rem;
        color: var(--sig-text-muted, #6b7080);
      }

      .list-badge {
        padding: 2px 7px;
        border-radius: var(--sig-radius);
        font-size: 0.62rem;
        font-weight: 700;
        white-space: nowrap;
        line-height: 1;
        display: inline-block;
      }
      .badge-mand {
        background: rgba(215, 159, 40, 0.14);
        color: var(--sig-yellow, #d79f28);
      }
      .badge-opt {
        background: rgba(120, 120, 120, 0.1);
        color: var(--sig-text-muted, #6b7080);
      }

      ::ng-deep .signer-option {
        --mdc-list-list-item-two-line-container-height: 60px;
        --mdc-list-list-item-container-shape: var(--sig-radius);
        --mdc-list-list-item-label-text-color: var(--sig-text, #1a1a2e);
        --mdc-list-list-item-supporting-text-color: var(--sig-text-muted, #6b7080);
        border: 1px solid transparent;
        margin-bottom: 3px;
        transition:
          border-color 0.2s,
          background-color 0.2s;
      }

      ::ng-deep .signer-option.signed {
        /* Removed green border to match existing unselected style but keeping green text */
        --mdc-list-list-item-label-text-color: var(--sig-green, #4caf50);
      }

      ::ng-deep .signer-option .list-meta-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin: auto 0;
      }

      ::ng-deep .signer-option .signed-icon {
        color: var(--sig-green, #4caf50);
        font-size: 24px;
        width: 24px;
        height: 24px;
        line-height: 24px;
      }

      ::ng-deep .signer-option .pending-icon {
        color: var(--sig-text-muted, #ccc);
        opacity: 0.4;
        font-size: 24px;
        width: 24px;
        height: 24px;
        line-height: 24px;
      }

      ::ng-deep .mdc-list-item.mdc-list-item--selected {
        background-color: #e8e8e8 !important;
        border: 1px solid transparent;
      }
    `,
  ],
})
export class SignerListComponent {
  @Output() signerSelected = new EventEmitter<Signer>();

  signers: Signer[] = [];
  selectedSigner: Signer | null = null;

  private readonly contentIdSubject = new BehaviorSubject<string>('default');
  private readonly destroyRef = inject(DestroyRef);

  @Input()
  set contentId(value: string) {
    const normalized = value?.trim() || 'default';
    if (normalized !== this.contentIdSubject.value) {
      this.selectedSigner = null;
      this.contentIdSubject.next(normalized);
    }
  }

  constructor(
    private readonly service: SignatureMaxiService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.contentIdSubject
      .pipe(
        switchMap((id) => this.service.getSigners(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((signers) => {
        this.signers = signers;
        if (!this.selectedSigner && signers.length > 0) {
          this.selectSigner(signers[0]);
          return;
        }
        if (this.selectedSigner) {
          const updated = signers.find((s) => s.id === this.selectedSigner?.id);
          if (updated && updated !== this.selectedSigner) {
            this.selectedSigner = updated;
          }
        }
        this.cdr.markForCheck();
      });
  }

  selectSigner(signer: Signer): void {
    this.selectedSigner = signer;
    this.signerSelected.emit(signer);
  }
}
