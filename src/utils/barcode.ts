import JsBarcode from 'jsbarcode';

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options?: {
    format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
  }
): void {
  try {
    if (!text) return;
    JsBarcode(canvas, text, {
      format: options?.format || 'CODE128',
      width: options?.width || 2,
      height: options?.height || 60,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize || 14,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000',
    });
  } catch (err) {
    console.warn('JsBarcode render error, falling back to CODE128:', err);
    try {
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: options?.width || 2,
        height: options?.height || 60,
        displayValue: true,
      });
    } catch (e) {
      console.error('Failed fallback barcode render:', e);
    }
  }
}

export function generateBarcodeSvg(text: string): string {
  try {
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgNode, text, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 5,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return svgNode.outerHTML;
  } catch (e) {
    return `<div style="padding:10px;font-family:monospace;font-weight:bold;color:#000">${text}</div>`;
  }
}

let globalBarcodeCounter = 0;

export function generateNonRepeatingBarcode(existingBarcodes?: string[]): string {
  globalBarcodeCounter = (globalBarcodeCounter + 1) % 99;
  const prefix = '779';
  const nowStr = Date.now().toString();
  const timeSlice = nowStr.slice(-5);
  const counterStr = globalBarcodeCounter.toString().padStart(2, '0');
  const randomStr = Math.floor(10 + Math.random() * 90).toString();
  const candidate = `${prefix}${timeSlice}${counterStr}${randomStr}`;

  if (existingBarcodes && existingBarcodes.includes(candidate)) {
    return generateNonRepeatingBarcode(existingBarcodes);
  }
  return candidate;
}

export function generateSequentialBarcode(existingCount: number = 0): string {
  return generateNonRepeatingBarcode();
}

export function generateRandomBarcode(): string {
  const prefix = '750';
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${randomPart}`;
}

export function generateRandomSKU(category?: string): string {
  const catPrefix = category ? category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'REP') : 'REP';
  const num = Math.floor(100 + Math.random() * 900);
  return `${catPrefix}-${num}`;
}
