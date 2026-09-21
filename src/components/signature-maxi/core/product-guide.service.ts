import { Injectable } from '@angular/core';
import { ShepherdService } from 'angular-shepherd';
import type { StepOptions, StepOptionsButton, Tour } from 'shepherd.js';

/** Breathing room between a highlighted component and the edge of the overlay cutout. */
const OVERLAY_PADDING = 6;
/** Radius used when a tour target has no rounding of its own (plain wrapper elements): the app's --sig-radius. */
const DEFAULT_RADIUS = 8;

const SHARED_STEP_OPTIONS: StepOptions = {
  cancelIcon: { enabled: true },
  classes: 'sigmaxi-shepherd-step',
  scrollTo: { behavior: 'smooth', block: 'center' },
  arrow: true,
  modalOverlayOpeningPadding: OVERLAY_PADDING,
  modalOverlayOpeningRadius: DEFAULT_RADIUS + OVERLAY_PADDING,
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

/** Lets the tour open and close the real Sign All dialog so its parts can be highlighted. */
export interface FeatureTourHooks {
  openSignDialog: () => void;
  closeDialogs: () => Promise<void>;
}

const NEXT_BACK = () => withNav([{ text: 'Back', action: 'back', secondary: true }, { text: 'Next', action: 'next' }]);

/**
 * Cutout radius that follows the highlighted component: its own border-radius (a % radius is resolved
 * against the element size) plus the overlay padding, so the cutout edge stays concentric with the component.
 */
function overlayRadius(selector: string): number {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return DEFAULT_RADIUS + OVERLAY_PADDING;

  const raw = getComputedStyle(el).borderTopLeftRadius;
  let radius = parseFloat(raw);
  if (raw.includes('%')) {
    const box = el.getBoundingClientRect();
    radius = (radius / 100) * Math.min(box.width, box.height);
  }
  if (!Number.isFinite(radius) || radius <= 0) radius = DEFAULT_RADIUS;
  return Math.round(radius) + OVERLAY_PADDING;
}

/** Applies the per-target rounded cutout to every step that attaches to an element. */
function withOverlay(steps: StepOptions[]): StepOptions[] {
  return steps.map((step) => {
    const target = step.attachTo?.element;
    return typeof target === 'string'
      ? { ...step, modalOverlayOpeningPadding: OVERLAY_PADDING, modalOverlayOpeningRadius: overlayRadius(target) }
      : step;
  });
}

/** Guided product tours built on Shepherd.js, themed to match the signature-maxi design tokens. */
@Injectable({ providedIn: 'root' })
export class ProductGuideService {
  constructor(private readonly shepherd: ShepherdService) {}

  /** Walks through the core signing workflow: content ID, signers, views, signing, progress and submission. */
  startFeatureTour(hooks?: FeatureTourHooks): void {
    this._configure();
    let dialogOpenedByTour = false;
    const closeTourDialog = (): Promise<void> => {
      if (!hooks || !dialogOpenedByTour) return Promise.resolve();
      dialogOpenedByTour = false;
      return hooks.closeDialogs();
    };
    const listView = !!document.querySelector('app-role-group-list');

    const signerSteps: StepOptions[] = listView
      ? [
          {
            id: 'signers-grid',
            attachTo: { element: '[data-tour="signers-grid"]', on: 'top' },
            title: 'Signers by role',
            text: 'List view groups every signer under their role. Sign, edit, view or delete an individual signature without opening Sign All.',
            buttons: NEXT_BACK(),
          },
          ...(document.querySelector('[data-tour="role-label"]')
            ? ([
                {
                  id: 'role-label',
                  attachTo: { element: '[data-tour="role-label"]', on: 'bottom' },
                  title: 'Role and requirement',
                  text: 'A red * means the role has at least one mandatory signer. Hover the ? icon to see what the role is responsible for.',
                  buttons: NEXT_BACK(),
                },
                {
                  id: 'user-row',
                  attachTo: { element: '[data-tour="user-row"]', on: 'top' },
                  title: 'Signer rows',
                  text: 'Each row shows the name, email and when they signed. Hover the image icon for a signature preview with the sign time. Add or edit, view and delete appear beside the card on hover or focus, the same actions Card view shows on each card; deleting asks you to confirm.',
                  buttons: NEXT_BACK(),
                  when: {
                    show: () => document.querySelector('[data-tour="user-row"]')?.classList.add('tour-reveal'),
                    hide: () => document.querySelector('[data-tour="user-row"]')?.classList.remove('tour-reveal'),
                  },
                },
              ] as StepOptions[])
            : []),
        ]
      : [
          {
            id: 'signers-grid',
            attachTo: { element: '[data-tour="signers-grid"]', on: 'top' },
            title: 'Signer cards',
            text: 'Each card represents one signer, with their role, mandatory badge and a preview of the signature.',
            buttons: NEXT_BACK(),
          },
          ...(document.querySelector('app-signer-card .card-actions')
            ? ([
                {
                  id: 'card-actions',
                  attachTo: { element: 'app-signer-card .card-actions', on: 'top' },
                  title: 'Card actions',
                  text: 'Add or edit the signature, view it full size, or delete it — deleting asks you to confirm. List view offers the same actions beside each row.',
                  buttons: NEXT_BACK(),
                },
              ] as StepOptions[])
            : []),
        ];

    this.shepherd.addSteps(
      withOverlay([
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
          buttons: NEXT_BACK(),
        },
        {
          id: 'status-pills',
          attachTo: { element: '[data-tour="status-pills"]', on: 'bottom' },
          title: 'Status at a glance',
          text: 'These pills show how many signers are registered, how many have signed, and whether all mandatory signatures are complete.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'view-toggle',
          attachTo: { element: '[data-tour="view-toggle"]', on: 'bottom' },
          title: 'Card or List view',
          text: 'Switch how signers are shown: Card view lays them out as a grid of cards, List view groups them by role with name, email and signing status. Your choice is remembered.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'settings-toggle',
          attachTo: { element: '[data-tour="settings-toggle"]', on: 'bottom' },
          title: 'Settings',
          text: 'Open the settings panel to manage signers and customize the view, appearance, signature modes and watermarks. We cover this in the Customization tour.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'sign-all',
          attachTo: { element: '[data-tour="sign-all"]', on: 'bottom' },
          title: 'Sign All',
          text: 'Opens the signature dialog for every pending signer in sequence, so a full round of signatures can be collected in one flow. Next we open it.',
          buttons: NEXT_BACK(),
          beforeShowPromise: closeTourDialog,
        },
        ...(hooks
          ? ([
              {
                id: 'sign-dialog',
                attachTo: { element: '[data-tour="sign-dialog-header"]', on: 'bottom' },
                title: 'Sign All panel',
                text: 'Everything for a signing round lives here. The reset icon clears every signature, and the close icon leaves without completing.',
                buttons: NEXT_BACK(),
                beforeShowPromise: () =>
                  new Promise<void>((resolve) => {
                    if (!document.querySelector('[data-tour="sign-dialog-header"]')) {
                      dialogOpenedByTour = true;
                      hooks.openSignDialog();
                    }
                    setTimeout(resolve, 600);
                  }),
              },
              {
                id: 'sign-dialog-users',
                attachTo: { element: '[data-tour="sign-dialog-users"]', on: 'left' },
                title: 'Pick a signer',
                text: 'Choose who signs on the left. Mandatory signers are marked, and a check appears once someone has signed.',
                buttons: NEXT_BACK(),
              },
              {
                id: 'sign-dialog-capture',
                attachTo: { element: '[data-tour="sign-dialog-capture"]', on: 'right' },
                title: 'Capture the signature',
                text: 'Sign, write or capture/upload — whichever modes are enabled in Settings. Confirm saves the signature for the selected signer.',
                buttons: NEXT_BACK(),
              },
              {
                id: 'sign-dialog-footer',
                attachTo: { element: '[data-tour="sign-dialog-footer"]', on: 'top' },
                title: 'Complete or cancel',
                text: 'Complete unlocks once every mandatory signer has signed. Cancel closes the panel and keeps whatever was already captured.',
                buttons: NEXT_BACK(),
              },
            ] as StepOptions[])
          : []),
        {
          id: 'progress',
          attachTo: { element: '[data-tour="progress"]', on: 'bottom' },
          title: 'Progress tracker',
          text: 'Tracks how many signers have signed out of the total, and turns green once every mandatory signer has completed their signature.',
          buttons: NEXT_BACK(),
          beforeShowPromise: closeTourDialog,
        },
        ...signerSteps,
        {
          id: 'submit',
          title: "You're all set",
          text: 'Once every mandatory signer has signed, a submit banner appears at the bottom letting you finalize the document. Want to see the customization options next?',
          buttons: withNav([
            { text: 'Back', action: 'back', secondary: true },
            { text: 'Done', action: 'complete' },
          ]),
        },
      ]),
    );
    this.shepherd.tourObject?.on('cancel', () => void closeTourDialog());
    this.shepherd.tourObject?.on('complete', () => void closeTourDialog());
    this.shepherd.start();
  }

  /** Walks through the settings panel: view, theme, signers, signature modes, canvas and watermark customization. */
  startCustomizationTour(): void {
    this._configure();
    this.shepherd.requiredElements = [
      {
        selector: '[data-tour="appearance"]',
        title: 'Settings panel not open',
        message: 'Open the settings panel first, then start the Customization tour again.',
      },
    ];
    this.shepherd.addSteps(
      withOverlay([
        {
          id: 'appearance',
          attachTo: { element: '[data-tour="appearance"]', on: 'bottom' },
          title: 'Appearance',
          text: 'Switch between light and dark mode. The choice is remembered for your next visit.',
          buttons: withNav([{ text: 'Skip', action: 'cancel', secondary: true }, { text: 'Next', action: 'next' }]),
        },
        {
          id: 'view-mode',
          attachTo: { element: '[data-tour="view-mode"]', on: 'bottom' },
          title: 'Signer view',
          text: 'Choose Card view for a grid of signer cards, or List view to group signers by role with their email and signing status. The same switch lives in the dashboard header.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'manage-signers',
          attachTo: { element: '[data-tour="manage-signers"]', on: 'bottom' },
          title: 'Manage signers',
          text: 'Add, rename or remove signers, set their email and role, and control per-signer permissions: whether a signature is mandatory, editable, or deletable.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'signer-editor',
          attachTo: { element: '[data-tour="signer-editor"]', on: 'left' },
          title: 'Edit each signer',
          text: 'Each row is one signer: name and email on the left, then their role. Req. makes the signature mandatory, Ed. lets them edit it later and Del. lets them delete it. The bin removes the signer.',
          buttons: NEXT_BACK(),
          beforeShowPromise: () =>
            new Promise<void>((resolve) => {
              if (!document.querySelector('[data-tour="signer-editor"]')) {
                document.querySelector<HTMLButtonElement>('[data-tour="manage-signers"] button')?.click();
              }
              setTimeout(resolve, 400);
            }),
        },
        {
          id: 'signer-editor-actions',
          attachTo: { element: '[data-tour="signer-editor-actions"]', on: 'left' },
          title: 'Save your changes',
          text: 'Add Signer appends a row, Default List restores the sample team and Revert discards unsaved edits. Apply saves the list to the dashboard.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'signature-modes',
          attachTo: { element: '[data-tour="signature-modes"]', on: 'bottom' },
          title: 'Signature capture modes',
          text: 'Choose which capture methods are available in the signature dialog: draw, type a name in a handwritten font, or upload/photograph a signature.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'drawing-pad-mode',
          attachTo: { element: '[data-tour="drawing-pad-mode"]', on: 'bottom' },
          title: 'Drawing pad engine',
          text: 'Switch the drawing canvas between the New pad and the Legacy signature_pad engine, useful if you need a specific rendering fallback.',
          buttons: NEXT_BACK(),
        },
        {
          id: 'canvas-size',
          attachTo: { element: '[data-tour="canvas-size"]', on: 'bottom' },
          title: 'Canvas size',
          text: 'Pick the signature canvas dimensions — Small, Medium or Large — all locked to a 9:4 aspect ratio.',
          buttons: NEXT_BACK(),
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
      ]),
    );
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
