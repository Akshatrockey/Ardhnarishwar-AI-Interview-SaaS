/**
 * Ardhnarishwar SaaS - PDF Generation & Export Service
 * Provides:
 * 1. Interactive Client-Side Print-to-PDF layout trigger
 * 2. Abstract interface and contract for future backend headless PDF microservices (e.g. Playwright/WeasyPrint)
 */

export interface PDFExportOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  includeVideoBookmarks?: boolean;
}

export interface IPDFGenerator {
  exportDossier(candidateId: string, options?: PDFExportOptions): Promise<boolean>;
}

export class ClientSidePrintPDFGenerator implements IPDFGenerator {
  /**
   * Triggers the browser's optimized @media print rendering pipeline.
   */
  async exportDossier(candidateId: string, options?: PDFExportOptions): Promise<boolean> {
    if (typeof window !== 'undefined') {
      window.print();
      return true;
    }
    return false;
  }
}

export class BackendServerPDFGenerator implements IPDFGenerator {
  private backendBaseUrl: string;

  constructor(backendBaseUrl: string = 'http://localhost:8000') {
    this.backendBaseUrl = backendBaseUrl;
  }

  /**
   * Future extensibility hook: Calls backend headless PDF rendering endpoint.
   */
  async exportDossier(candidateId: string, options?: PDFExportOptions): Promise<boolean> {
    console.info(`[PDFGenerator] Backend PDF export requested for candidate ${candidateId}. Delegating to client-side fallback.`);
    // Fallback to client print until backend renderer is provisioned
    if (typeof window !== 'undefined') {
      window.print();
      return true;
    }
    return false;
  }
}

export const PDFService: IPDFGenerator = new ClientSidePrintPDFGenerator();
