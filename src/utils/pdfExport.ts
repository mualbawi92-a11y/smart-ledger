import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  filename?: string;
  onProgress?: (isGenerating: boolean) => void;
}

/**
 * Exports an HTML element directly to a high-fidelity PDF file.
 * Preserves full Arabic text rendering and RTL layout via canvas rasterization.
 */
export async function exportElementToPdf(
  elementOrId: HTMLElement | string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    orientation = 'portrait',
    marginMm = 8,
    filename = 'smart_ledger_report.pdf',
    onProgress,
  } = options;

  let targetEl: HTMLElement | null = null;
  if (typeof elementOrId === 'string') {
    targetEl = document.getElementById(elementOrId);
  } else {
    targetEl = elementOrId;
  }

  if (!targetEl) {
    console.error('Target element not found for PDF export');
    return false;
  }

  if (onProgress) onProgress(true);

  try {
    // Clone or capture target element with high DPI for crisp print quality
    const canvas = await html2canvas(targetEl, {
      scale: 2, // 2x scale ensures sharp fonts and lines
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetEl.scrollWidth > 900 ? targetEl.scrollWidth : 1024,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Standard A4 dimensions in mm
    const pdfPageWidth = orientation === 'portrait' ? 210 : 297;
    const pdfPageHeight = orientation === 'portrait' ? 297 : 210;

    const printableWidth = pdfPageWidth - marginMm * 2;
    const printableHeight = pdfPageHeight - marginMm * 2;

    const imgHeightInPdf = (canvas.height * printableWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Check if the content fits in one page or needs pagination
    if (imgHeightInPdf <= printableHeight) {
      pdf.addImage(
        imgData,
        'JPEG',
        marginMm,
        marginMm,
        printableWidth,
        imgHeightInPdf,
        undefined,
        'FAST'
      );
    } else {
      // Multi-page slicing using canvas chunks
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      const pixelPageHeight = Math.floor((printableHeight * canvas.width) / printableWidth);

      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height && pageCtx) {
        const remainingPixels = canvas.height - renderedHeight;
        const currentSliceHeight = Math.min(pixelPageHeight, remainingPixels);

        pageCanvas.width = canvas.width;
        pageCanvas.height = currentSliceHeight;

        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        pageCtx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          canvas.width,
          currentSliceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightMm = (currentSliceHeight * printableWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          pageImgData,
          'JPEG',
          marginMm,
          marginMm,
          printableWidth,
          sliceHeightMm,
          undefined,
          'FAST'
        );

        renderedHeight += currentSliceHeight;
        pageIndex++;
      }
    }

    const finalName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalName);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    // Graceful fallback to browser print
    window.print();
    return false;
  } finally {
    if (onProgress) onProgress(false);
  }
}
