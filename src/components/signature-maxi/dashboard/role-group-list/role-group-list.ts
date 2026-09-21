import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { roleHelpText } from '../../core/role-info';
import { Signer } from '../../core/signer.interface';

interface RoleGroup {
  role: string;
  mandatory: boolean;
  signers: Signer[];
}

@Component({
  selector: 'app-role-group-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './role-group-list.html',
  styleUrls: ['./role-group-list.scss'],
})
export class RoleGroupListComponent {
  @Input() set signers(value: Signer[]) {
    this.groups = this.groupByRole(value ?? []);
  }
  @Output() view = new EventEmitter<Signer>();
  @Output() sign = new EventEmitter<Signer>();
  @Output() delete = new EventEmitter<Signer>();

  groups: RoleGroup[] = [];
  private readonly safeUrls = new Map<string, SafeUrl>();

  constructor(private readonly sanitizer: DomSanitizer) {}

  helpFor(role: string): string {
    return roleHelpText(role);
  }

  previewSrc(s: Signer): SafeUrl | null {
    const url = s.signatureDataUrl;
    if (!url) return null;
    let safe = this.safeUrls.get(url);
    if (!safe) {
      safe = this.sanitizer.bypassSecurityTrustUrl(url);
      this.safeUrls.set(url, safe);
    }
    return safe;
  }

  trackByRole(_i: number, g: RoleGroup): string {
    return g.role;
  }

  trackById(_i: number, s: Signer): string {
    return s.id;
  }

  private groupByRole(signers: Signer[]): RoleGroup[] {
    const groups = new Map<string, RoleGroup>();
    for (const s of signers) {
      const role = s.role?.trim() || 'Unassigned';
      let group = groups.get(role);
      if (!group) {
        group = { role, mandatory: false, signers: [] };
        groups.set(role, group);
      }
      group.signers.push(s);
      group.mandatory ||= s.mandatory;
    }
    return [...groups.values()];
  }
}
