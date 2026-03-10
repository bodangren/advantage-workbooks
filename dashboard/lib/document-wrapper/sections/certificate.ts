import { WorkbookDocumentOptions, ThemeColors } from '../types';
import { escapeHtml } from '../utils';

export function generateCertificateSection(options: WorkbookDocumentOptions, theme: ThemeColors): string {
  return `
    <div class="section-certificate">
      <div class="certificate-border">
        <div class="certificate-inner">
          <h1 class="cert-title" style="color: ${theme.primary};">Certificate of Completion</h1>
          <div class="cert-subtitle">This is to certify that</div>
          <div class="cert-student-name"></div>
          <div class="cert-text">has successfully completed the Reading Advantage</div>
          <div class="cert-course-name">${escapeHtml(options.seriesName)} Level ${escapeHtml(options.seriesLevel)}</div>
          <div class="cert-text">workbook program, demonstrating dedication and outstanding effort in developing their English reading and writing skills.</div>
          
          <div class="cert-signatures">
            <div class="cert-sig-block">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-label">Teacher's Signature</div>
            </div>
            <div class="cert-sig-block">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-label">Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}