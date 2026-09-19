import { Injectable } from '@angular/core';
import { ShepherdService } from 'angular-shepherd';
import type { StepOptions, StepOptionsButton, Tour } from 'shepherd.js';

const SHARED_STEP_OPTIONS: StepOptions = {
  cancelIcon: { enabled: true },
  classes: 'sigmaxi-shepherd-step',
  scrollTo: { behavior: 'smooth', block: 'center' },
  arrow: true,
};

type NavAction = 'back' | 'next' | 'cancel' | 'complete';

function withNav(buttons: Array<{ text: string; action: NavAction; secondary?: boolean }>): StepOptionsButton[] {
  return buttons.map((b) => ({
    text: b.text,
    secondary: b.secondary,
    action(this: Tour) {
      this[b.action]();
    },
  }));
}

/** Guided product tours built on Shepherd.js, themed to match the signature-maxi design tokens. */
@Injectable({ providedIn: 'root' })
export class ProductGuideService {
  constructor(private readonly shepherd: ShepherdService) {}

  /** Walks through the core signing workflow: content ID, signers, signing, progress and submission. */
  startFeatureTour(): void {
    this._configure();
    this.shepherd.addSteps([
      {
        id: 'brand',
        attachTo: { element: '[data-tour="brand"]', on: 'bottom' },
        title: 'Welcome to Signature Maxi',
        text: 'This quick tour covers the core features for capturing and tracking signatures. You can restart it anytime from the guide button.',
        buttons: withNav([{ text: 'Skip', action: 'cancel', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'content-id',
        attachTo: { element: '[data-tour="content-id"]', on: 'bottom' },
        title: 'Content ID',
        text: 'Every signing session is scoped to a Content ID — this keeps signers, watermark and capture settings separate per document. Click the edit icon to change it.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'status-pills',
        attachTo: { element: '[data-tour="status-pills"]', on: 'bottom' },
        title: 'Status at a glance',
        text: 'These pills show how many signers are registered, how many have signed, and whether all mandatory signatures are complete.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'settings-toggle',
        attachTo: { element: '[data-tour="settings-toggle"]', on: 'bottom' },
        title: 'Settings',
        text: 'Open the settings panel to manage signers and customize appearance, signature modes and watermarks. We cover this in the Customization tour.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'sign-all',
        attachTo: { element: '[data-tour="sign-all"]', on: 'bottom' },
        title: 'Sign All',
        text: 'Opens the signature dialog for every pending signer in sequence, so a full round of signatures can be collected in one flow.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'progress',
        attachTo: { element: '[data-tour="progress"]', on: 'bottom' },
        title: 'Progress tracker',
        text: 'Tracks how many signers have signed out of the total, and turns green once every mandatory signer has completed their signature.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'signers-grid',
        attachTo: { element: '[data-tour="signers-grid"]', on: 'top' },
        title: 'Signer cards',
        text: 'Each card represents one signer. Sign, view or delete an individual signature directly from its card without opening Sign All.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'submit',
        title: "You're all set",
        text: 'Once every mandatory signer has signed, a submit banner appears at the bottom letting you finalize the document. Want to see the customization options next?',
        buttons: withNav([
          { text: 'Back', action: 'back', secondary: true },
          { text: 'Done', action: 'complete' },
        ]),
      },
    ]);
    this.shepherd.start();
  }

  /** Walks through the settings panel: theme, signers, signature modes, canvas and watermark customization. */
  startCustomizationTour(): void {
    this._configure();
    this.shepherd.requiredElements = [
      {
        selector: '[data-tour="appearance"]',
        title: 'Settings panel not open',
        message: 'Open the settings panel first, then start the Customization tour again.',
      },
    ];
    this.shepherd.addSteps([
      {
        id: 'appearance',
        attachTo: { element: '[data-tour="appearance"]', on: 'bottom' },
        title: 'Appearance',
        text: 'Switch between light and dark mode. The choice is remembered for your next visit.',
        buttons: withNav([{ text: 'Skip', action: 'cancel', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'manage-signers',
        attachTo: { element: '[data-tour="manage-signers"]', on: 'bottom' },
        title: 'Manage signers',
        text: 'Add, rename, reorder or remove signers, and control per-signer permissions: whether a signature is mandatory, editable, or deletable.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'signature-modes',
        attachTo: { element: '[data-tour="signature-modes"]', on: 'bottom' },
        title: 'Signature capture modes',
        text: 'Choose which capture methods are available in the signature dialog: draw, type a name in a handwritten font, or upload/photograph a signature.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'drawing-pad-mode',
        attachTo: { element: '[data-tour="drawing-pad-mode"]', on: 'bottom' },
        title: 'Drawing pad engine',
        text: 'Switch the drawing canvas between the New pad and the Legacy signature_pad engine, useful if you need a specific rendering fallback.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'canvas-size',
        attachTo: { element: '[data-tour="canvas-size"]', on: 'bottom' },
        title: 'Canvas size',
        text: 'Pick the signature canvas dimensions — Small, Medium or Large — all locked to a 9:4 aspect ratio.',
        buttons: withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]),
      },
      {
        id: 'watermark',
        attachTo: { element: '[data-tour="watermark"]', on: 'top' },
        title: 'Watermark',
        text: 'Toggle the watermark and fine-tune its color, opacity, angle, font size, and the content/timestamp label text. It stamps every newly confirmed signature.',
        buttons: withNav([
          { text: 'Back', action: 'back', secondary: true },
          { text: 'Done', action: 'complete' },
        ]),
      },
    ]);
    this.shepherd.start();
  }

  cancel(): void {
    this.shepherd.cancel();
  }

  private _configure(): void {
    this.shepherd.tourObject?.cancel();
    this.shepherd.defaultStepOptions = SHARED_STEP_OPTIONS;
    this.shepherd.modal = true;
    this.shepherd.confirmCancel = false;
    this.shepherd.requiredElements = [];
  }
}
