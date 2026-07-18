import SignaturePad from 'signature_pad';

export class SignatureHelper {
  /** Resizes canvas for high-DPI displays */
  static resizeCanvas(canvas: HTMLCanvasElement, pad: SignaturePad): void {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    pad.clear();
  }

  /** Parses a data URL or raw SVG string into a normalized SVG XML string */
  static toSvgXml(signature: string | null | undefined): string | null {
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

    if (!decoded.includes('xmlns=')) {
      decoded = decoded.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return decoded;
  }

  /** Generates an SVG string using standard cursive system fonts */
  static generateTypedSvg(name: string, font: string, width = 450, height = 200): string {
    const fallbackName = name.trim() || 'Authorized User';

    // Escape standard XML entities
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const safeName = esc(fallbackName);

    // Strip quotes from font and escape remaining characters to prevent SVG injection
    const safeFont = esc(font.replace(/['"]/g, ''));

    // Calculate relative font size and line position based on height
    const fontSize = Math.floor(height * 0.28);
    const lineY = Math.floor(height * 0.75);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="${safeFont}" font-size="${fontSize}px" font-style="italic" fill="#111111">${safeName}</text>
  <line x1="${width * 0.05}" y1="${lineY}" x2="${width * 0.95}" y2="${lineY}" stroke="rgba(0,0,0,0.15)" stroke-width="1" />
</svg>`;
  }

  /** Starts the device camera (cross-platform desktop & mobile) */
  static async startCamera(
    videoElement: HTMLVideoElement,
  ): Promise<{ stream: MediaStream | null; error?: string }> {
    if (!navigator?.mediaDevices?.getUserMedia) return { stream: null, error: 'NotSupportedError' };

    const constraints: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];

    let lastError: any;
    for (const c of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(c);
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', ''); // iOS Safari
        videoElement.setAttribute('muted', '');
        await videoElement.play();
        return { stream };
      } catch (err) {
        lastError = err;
      }
    }
    return { stream: null, error: lastError?.name || 'UnknownError' };
  }

  /** Stops the device camera */
  static stopCamera(stream: MediaStream | null): void {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  /** Reads a File to a data URL */
  static readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /** Wraps an image data URL into an SVG <image> element for uniform SVG storage */
  static imageToSvg(dataUrl: string, width = 450, height = 200): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
  <image x="0" y="0" width="${width}" height="${height}" href="${dataUrl}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
  }

  /** Captures a video frame and returns it as a PNG data URL */
  static captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  /**
   * EXTERNAL INTEGRATION HOOK
   * Override this method to send the confirmed SVG+XML payload to your external backend or enterprise app.
   */
  static async exportSignature(payload: {
    contentId: string;
    userId: string;
    role: string;
    svgXml: string;
  }): Promise<void> {
    // Developers: Override this static method in your app initialization logic.
    // Example:
    // SignatureHelper.exportSignature = async (payload) => {
    //   await http.post('/api/signatures/upload', payload);
    // };
    // console.info(`[SignatureMaxi] exportSignature hook called for ${payload.userId} (Role: ${payload.role}) on Content ID: ${payload.contentId}.`);
    // console.info(`[SignatureMaxi] Payload length: ${payload.svgXml.length} bytes.`);
    console.info(`[SignatureMaxi] enable to upload to external app.`);
    return Promise.resolve();
  }
}
