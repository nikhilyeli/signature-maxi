import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DEFAULT_SIGNERS } from '../dashboard/signature-maxi/signature-maxi';
import { SignatureCaptureConfig } from '../features/signature-capture/signature-capture';
import { SignatureHelper } from './signature-maxi.helper';
import { Signer } from './signer.interface';

export interface SignatureWatermarkConfig {
  enabled?: boolean;
  textColor?: string;
  opacity?: number;
  angleDeg?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  lineHeight?: number;
  widthRatio?: number;
  heightRatio?: number;
  contentLabel?: string;
  timestampLabel?: string;
}

const DEFAULT_WATERMARK_CONFIG: Required<SignatureWatermarkConfig> = {
  enabled: true,
  textColor: '#000000',
  opacity: 0.25,
  angleDeg: -28,
  fontSize: 18,
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 600,
  lineHeight: 24,
  widthRatio: 0.5,
  heightRatio: 0.5,
  contentLabel: 'Content ID',
  timestampLabel: 'has signed at',
};

@Injectable({ providedIn: 'root' })
export class SignatureMaxiService {
  private readonly defaultContentId = 'default';
  private readonly signersByContent = new Map<string, BehaviorSubject<Signer[]>>();
  private readonly watermarkByContent = new Map<string, Partial<SignatureWatermarkConfig>>();
  private readonly captureConfigByContent = new Map<string, SignatureCaptureConfig>();

  getSigners(contentId = this.defaultContentId): Observable<Signer[]> {
    return this.getContentSubject(contentId).asObservable();
  }

  setSigners(contentId: string, signers: Signer[]): void {
    const updated = this.cloneSigners(signers).map((s) => ({
      ...s,
      signatureDataUrl:
        s.signatureDataUrl || (s.signature ? this.toSignatureImageSrc(s.signature) : null),
    }));
    this.getContentSubject(contentId).next(updated);
    this.saveToStorage(contentId);
  }

  getSignersSnapshot(contentId = this.defaultContentId): Signer[] {
    return this.cloneSigners(this.getContentSubject(contentId).value);
  }

  setSignature(
    contentId: string,
    signerId: string,
    signature: string | null,
    signedAt: string | null = null,
    signatureRawSvg: string | null = null,
  ): void {
    const normalizedWatermarkedSignature = this.toSvgXml(signature);
    const normalizedRawSignature = this.toSvgXml(signatureRawSvg ?? signature);
    const updatedSigners = this.getContentSubject(contentId).value.map((signer) =>
      signer.id === signerId
        ? {
            ...signer,
            signatureSvg: normalizedRawSignature,
            signatureWatermarkedSvg: normalizedWatermarkedSignature,
            signature: normalizedWatermarkedSignature ?? normalizedRawSignature,
            signatureDataUrl: this.toSignatureImageSrc(
              normalizedWatermarkedSignature ?? normalizedRawSignature,
            ),
            signed: !!(normalizedRawSignature ?? normalizedWatermarkedSignature),
            signedAt:
              normalizedRawSignature || normalizedWatermarkedSignature
                ? this.formatDateTime(signedAt ?? new Date())
                : null,
          }
        : signer,
    );
    this.getContentSubject(contentId).next(updatedSigners);
    this.saveToStorage(contentId);

    // Call external hook for business integration
    if (normalizedWatermarkedSignature) {
      const signer = this.getContentSubject(contentId).value.find((s) => s.id === signerId);
      if (signer) {
        SignatureHelper.exportSignature({
          contentId,
          userId: signer.id,
          role: signer.role,
          svgXml: normalizedWatermarkedSignature,
        }).catch((err) => console.error('Error exporting signature:', err));
      }
    }
  }

  upsertSignerSignature(
    contentId: string,
    signerId: string,
    signature: string | null,
    signedAt: string | null = null,
    signatureRawSvg: string | null = null,
  ): void {
    this.setSignature(contentId, signerId, signature, signedAt, signatureRawSvg);
  }

  setWatermarkConfig(contentId: string, config: Partial<SignatureWatermarkConfig>): void {
    this.watermarkByContent.set(this.normalizeContentId(contentId), { ...config });
    this.saveToStorage(contentId);
  }

  getWatermarkConfig(contentId = this.defaultContentId): Required<SignatureWatermarkConfig> {
    return {
      ...DEFAULT_WATERMARK_CONFIG,
      ...(this.watermarkByContent.get(this.normalizeContentId(contentId)) ?? {}),
    };
  }

  setCaptureConfig(contentId: string, config: SignatureCaptureConfig): void {
    this.captureConfigByContent.set(this.normalizeContentId(contentId), { ...config });
    this.saveToStorage(contentId);
  }

  getCaptureConfig(contentId = this.defaultContentId): SignatureCaptureConfig {
    return {
      enableDraw: true,
      enableType: true,
      enableUpload: true,
      canvasSize: 'small',
      ...(this.captureConfigByContent.get(this.normalizeContentId(contentId)) ?? {}),
    };
  }

  resetSignerSignature(contentId: string, signerId: string): void {
    const updatedSigners = this.getContentSubject(contentId).value.map((signer) =>
      signer.id === signerId
        ? {
            ...signer,
            signed: false,
            signatureSvg: null,
            signatureWatermarkedSvg: null,
            signature: null,
            signatureDataUrl: null,
            signedAt: null,
          }
        : signer,
    );
    this.getContentSubject(contentId).next(updatedSigners);
    this.saveToStorage(contentId);
  }

  resetSignatures(contentId = this.defaultContentId): void {
    const resetSigners = this.getContentSubject(contentId).value.map((signer) => ({
      ...signer,
      signed: false,
      signatureSvg: null,
      signatureWatermarkedSvg: null,
      signature: null,
      signatureDataUrl: null,
      signedAt: null,
    }));
    this.getContentSubject(contentId).next(resetSigners);
    this.saveToStorage(contentId);
  }

  restoreDefaults(contentId: string): void {
    const id = this.normalizeContentId(contentId);
    this.watermarkByContent.delete(id);
    this.captureConfigByContent.delete(id);

    // Deep copy DEFAULT_SIGNERS so we don't mutate the original
    const restoredSigners = DEFAULT_SIGNERS.map((s) => ({ ...s }));
    this.getContentSubject(contentId).next(restoredSigners);
    try {
      localStorage.removeItem(`sig_maxi_${id}_wm`);
      localStorage.removeItem(`sig_maxi_${id}_cap`);
    } catch {}
    this.saveToStorage(contentId);
  }

  toSvgXml(signature: string | null | undefined): string | null {
    if (!signature) return null;
    const trimmed = signature.trim();
    if (!trimmed) return null;

    let decoded = trimmed;
    if (trimmed.startsWith('data:image/svg+xml')) {
      const commaIndex = trimmed.indexOf(',');
      if (commaIndex === -1) return null;
      const payload = trimmed.slice(commaIndex + 1);
      try {
        if (trimmed.includes(';base64,')) decoded = atob(payload);
        else decoded = decodeURIComponent(payload);
      } catch {
        return null;
      }
    } else if (!trimmed.startsWith('<svg')) {
      return trimmed;
    }

    // Normalize SVG to prevent breakage
    if (!decoded.includes('xmlns=')) {
      decoded = decoded.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return decoded;
  }

  toSignatureImageSrc(signature: string | null | undefined): string | null {
    const svgXml = this.toSvgXml(signature);
    if (!svgXml) return null;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;
  }

  stampSignatureSvg(params: {
    contentId: string;
    signerName: string;
    signerRole: string;
    signatureSvgXml: string;
    submittedAt?: string;
    watermarkConfig?: Partial<SignatureWatermarkConfig>;
    omitSignerName?: boolean;
  }): string {
    const submittedAt = this.formatDateTime(params.submittedAt ?? new Date());
    const svgXml = this.toSvgXml(params.signatureSvgXml) ?? params.signatureSvgXml;
    const watermarkConfig = {
      ...this.getWatermarkConfig(params.contentId),
      ...(params.watermarkConfig ?? {}),
    };

    if (watermarkConfig.enabled === false) return svgXml;

    const width = this.extractSvgDimension(svgXml, 'width', 450);
    const height = this.extractSvgDimension(svgXml, 'height', 200);
    const overlay = this.buildWatermarkOverlay({
      contentId: params.contentId,
      signerName: params.signerName,
      signerRole: params.signerRole,
      submittedAt,
      width,
      height,
      watermarkConfig: { ...DEFAULT_WATERMARK_CONFIG, ...watermarkConfig },
      omitSignerName: params.omitSignerName,
    });

    if (svgXml.includes('</svg>')) return svgXml.replace('</svg>', `${overlay}</svg>`);
    return `${svgXml}${overlay}`;
  }

  private getContentSubject(contentId: string): BehaviorSubject<Signer[]> {
    const id = this.normalizeContentId(contentId);
    let subject = this.signersByContent.get(id);
    if (!subject) {
      subject = new BehaviorSubject<Signer[]>([]);
      this.signersByContent.set(id, subject);
      this.loadFromStorage(id);
    }
    return subject;
  }

  private normalizeContentId(contentId: string | null | undefined): string {
    return contentId?.trim() || this.defaultContentId;
  }

  private extractSvgDimension(svgXml: string, attr: 'width' | 'height', fallback: number): number {
    const match = svgXml.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
    if (!match?.[1]) return fallback;
    const val = Number.parseFloat(match[1]);
    return Number.isFinite(val) ? val : fallback;
  }

  private buildWatermarkOverlay(params: {
    contentId: string;
    signerName: string;
    signerRole: string;
    submittedAt: string;
    width: number;
    height: number;
    watermarkConfig: Required<SignatureWatermarkConfig>;
    omitSignerName?: boolean;
  }): string {
    const lines = [
      `${params.watermarkConfig.contentLabel}: ${params.contentId}`,
      ...(params.omitSignerName ? [] : [`Name: ${params.signerName}`]),
      `Role: ${params.signerRole}`,
      `${params.watermarkConfig.timestampLabel}: ${params.submittedAt}`,
    ];

    const lh = params.watermarkConfig.lineHeight;
    const totalTextHeight = lines.length * lh;

    // Create a pattern block that repeats
    // Make the pattern box slightly larger than the text to give it breathing room
    const patternWidth = params.width * 0.8;
    const patternHeight = totalTextHeight * 2.5;

    return `
      <defs>
        <pattern id="wm-pattern-${params.contentId}" x="0" y="0" width="${patternWidth}" height="${patternHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(${params.watermarkConfig.angleDeg})">
          <g opacity="${params.watermarkConfig.opacity}">
            ${lines
              .map(
                (line, i) =>
                  `<text x="${patternWidth / 2}" y="${patternHeight / 2 - totalTextHeight / 2 + i * lh}" text-anchor="middle" fill="${params.watermarkConfig.textColor}" font-size="${params.watermarkConfig.fontSize}" font-family="${this.escapeXml(params.watermarkConfig.fontFamily)}" font-weight="${params.watermarkConfig.fontWeight}">${this.escapeXml(line)}</text>`,
              )
              .join('')}
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#wm-pattern-${params.contentId})" pointer-events="none"></rect>
    `;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  private formatDateTime(value: string | Date | number): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = `${date.getFullYear()}`;
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 || 12;
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    const period = hour24 >= 12 ? 'pm' : 'am';

    return `${day}/${month}/${year} ${`${hour12}`.padStart(2, '0')}:${minute} ${period}`;
  }

  private cloneSigners(signers: Signer[]): Signer[] {
    return signers.map((s) => ({ ...s }));
  }

  private saveToStorage(contentId: string): void {
    const id = this.normalizeContentId(contentId);
    const signers = this.signersByContent.get(id)?.value || [];
    const wm = this.watermarkByContent.get(id) || {};
    const cap = this.captureConfigByContent.get(id) || {
      enableDraw: true,
      enableType: true,
      enableUpload: true,
    };
    try {
      sessionStorage.setItem(`sig_maxi_${id}_signers`, JSON.stringify(signers));
      localStorage.setItem(`sig_maxi_${id}_wm`, JSON.stringify(wm));
      localStorage.setItem(`sig_maxi_${id}_cap`, JSON.stringify(cap));
    } catch {}
  }

  private loadFromStorage(contentId: string): void {
    const id = this.normalizeContentId(contentId);
    try {
      const storedSigners = sessionStorage.getItem(`sig_maxi_${id}_signers`);
      if (storedSigners) {
        const signers = JSON.parse(storedSigners);
        this.signersByContent.get(id)?.next(signers);
      }
      const storedWm = localStorage.getItem(`sig_maxi_${id}_wm`);
      if (storedWm) {
        this.watermarkByContent.set(id, JSON.parse(storedWm));
      }
      const storedCap = localStorage.getItem(`sig_maxi_${id}_cap`);
      if (storedCap) {
        this.captureConfigByContent.set(id, JSON.parse(storedCap));
      }
    } catch {}
  }
}
