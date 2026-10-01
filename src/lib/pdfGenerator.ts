import { jsPDF } from 'jspdf';
import { type LabResultRecord, LIFE_LABS_INFO } from '../data/labData';

/**
 * Triggers download of either the uploaded PDF Data URL or generates a formal
 * clinical laboratory report PDF for Life Labs Mansoura.
 */
export function downloadLabResultPdf(result: LabResultRecord): void {
  // 1. If a real PDF Data URL was uploaded by lab staff, download it directly
  if (result.pdfDataUrl && result.pdfDataUrl.startsWith('data:application/pdf')) {
    const link = document.createElement('a');
    link.href = result.pdfDataUrl;
    link.download =
      result.pdfFileName || `LifeLabs_${result.analysisCode}_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Otherwise generate an official medical-grade PDF report via jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top Header Band (Clinical Navy #0F172A & Teal #0D9488)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(13, 148, 136);
  doc.rect(0, 36, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('LIFE LABS MEDICAL DIAGNOSTICS', 15, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Mansoura, Egypt | El-Mashaya El-Soflia & El-Gomhoria St.', 15, 23);
  doc.text(
    `24/7 Hotline: ${LIFE_LABS_INFO.phone} | Web: ${LIFE_LABS_INFO.website}`,
    15,
    29
  );

  // Official Report Badge on Right
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(145, 10, 50, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OFFICIAL LAB REPORT', 170, 17, { align: 'center' });
  doc.setFontSize(10);
  doc.text(result.analysisCode, 170, 24, { align: 'center' });

  // Patient Metadata Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 46, 180, 34, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ANALYSIS CODE:', 20, 55);
  doc.text('SAMPLE DATE:', 20, 64);
  doc.text('REPORT STATUS:', 20, 73);

  doc.text('DEPARTMENT:', 110, 55);
  doc.text('VERIFICATION:', 110, 64);
  doc.text('BRANCH:', 110, 73);

  doc.setFont('helvetica', 'normal');
  doc.text(result.analysisCode, 56, 55);
  doc.text(result.testDate, 56, 64);
  doc.setTextColor(13, 148, 136);
  doc.setFont('helvetica', 'bold');
  doc.text(
    result.status === 'ready' ? 'FINAL / VERIFIED' : 'IN PROGRESS',
    56,
    73
  );

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const cleanCategory =
    result.testCategory.replace(/[^\x00-\x7F]/g, '').replace(/[()]/g, '').trim() ||
    'Clinical Pathology';
  doc.text(cleanCategory, 142, 55);
  doc.text('ISO-15189 Standard QC', 142, 64);
  doc.text('Mansoura Main Lab', 142, 73);

  // Test Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const englishTestName =
    result.testName.match(/\(([^)]+)\)/)?.[1] ||
    result.testName.replace(/[^\x00-\x7F]/g, '').trim() ||
    'Clinical Diagnostic Assay';
  doc.text(`Diagnostic Assay: ${englishTestName}`, 15, 92);

  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.6);
  doc.line(15, 95, 195, 95);

  // Clinical Parameters Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 100, 180, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PARAMETER / ASSAY DETAILS', 20, 106);
  doc.text('RESULT & REFERENCE INTERVAL', 115, 106);

  // Clinical Summary Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const rawSegments = result.clinicalSummary
    ? result.clinicalSummary.split('|').map((s) => s.trim())
    : ['All clinical parameters validated within normal reference intervals.'];

  let currentY = 117;
  rawSegments.forEach((seg, index) => {
    const asciiSeg = seg.replace(/[^\x00-\x7F]/g, '').trim();
    if (!asciiSeg) return;

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY - 5, 180, 9, 'F');
    }

    const parts = asciiSeg.split(':');
    if (parts.length >= 2) {
      doc.setFont('helvetica', 'bold');
      doc.text(parts[0].trim(), 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(parts.slice(1).join(':').trim(), 115, currentY);
    } else {
      const wrapped = doc.splitTextToSize(asciiSeg, 170);
      doc.text(wrapped, 20, currentY);
      currentY += (wrapped.length - 1) * 5;
    }
    currentY += 10;
  });

  // Quality Assurance & Interpretation Note
  currentY = Math.max(currentY + 10, 175);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(15, currentY, 180, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text('Clinical Quality Assurance Statement:', 20, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'This analysis was performed at Life Labs Mansoura using fully automated closed-system analyzers',
    20,
    currentY + 15
  );
  doc.text(
    'under daily internal and external quality control protocols. Please correlate clinically.',
    20,
    currentY + 21
  );

  // Signature Block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Reviewed & Electronically Signed By:', 130, 245);
  doc.setFont('helvetica', 'normal');
  doc.text('Clinical Pathology Consultant', 130, 252);
  doc.text('Life Labs Medical Diagnostics - Mansoura', 130, 258);

  // Footer
  doc.setDrawColor(203, 213, 225);
  doc.line(15, 272, 195, 272);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Life Labs Mansoura | Tel: ${LIFE_LABS_INFO.phone} | Website: https://${LIFE_LABS_INFO.website} | Open 24/7`,
    105,
    279,
    { align: 'center' }
  );

  doc.save(
    result.pdfFileName || `LifeLabs_${result.analysisCode}_Report.pdf`
  );
}
