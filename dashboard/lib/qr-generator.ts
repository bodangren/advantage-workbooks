import qrcode from 'qrcode-generator';

export function generateQRCode(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') {
    return null;
  }

  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();

    const cellSize = 10;
    const margin = 1;
    const size = qr.getModuleCount();
    const totalSize = (size + margin * 2) * cellSize;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
    svg += `<g transform="translate(${margin * cellSize}, ${margin * cellSize})">`;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (qr.isDark(row, col)) {
          svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
        }
      }
    }

    svg += '</g></svg>';

    return svg;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return null;
  }
}

export function generateQRCodeDataURL(url: string | null | undefined): string | null {
  const svg = generateQRCode(url);
  if (!svg) {
    return null;
  }

  try {
    const svgString = unescape(encodeURIComponent(svg));
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(svgString).toString('base64')
      : btoa(svgString);
    
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error('QR code base64 encoding failed:', error);
    return null;
  }
}
