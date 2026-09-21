export type SignerViewMode = 'cards' | 'list';

export interface Signer {
  id: string;
  name: string;
  role: string;
  email?: string;
  mandatory: boolean;
  signed: boolean;
  signedAt?: string | null;
  signatureSvg?: string | null;
  signatureWatermarkedSvg?: string | null;
  signature: string | null;
  signatureDataUrl?: string | null;
  /** Role-based UI control to allow editing a signature */
  canEdit?: boolean;
  /** Role-based UI control to allow deleting a signature */
  canDelete?: boolean;
}
