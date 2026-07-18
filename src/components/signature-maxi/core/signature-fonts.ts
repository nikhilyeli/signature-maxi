import { SignatureHelper } from './signature-maxi.helper';

export function generateTypedSvgWithSystemFont(name: string, font: string): string {
  return SignatureHelper.generateTypedSvg(name, font);
}
