/**
 * Ardhnarishwar Enterprise API Client
 *
 * Robust, strictly-typed REST client connecting frontend portals directly to
 * FastAPI backend endpoints. Automatically manages JWT Bearer tokens,
 * multi-part form payloads, and structured error interception.
 */

import {
  CreateJobPayload,
  AddQuestionPayload,
  CompleteInterviewPayload,
} from '../types';

const API_BASE_URL: string =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '';

/**
 * Standardized envelope for all HTTP API responses across the enterprise SaaS platform.
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Enterprise HTTP API Client with automatic authorization header injection
 * and strongly-typed request/response helpers.
 */
export class ApiClient {
  /**
   * Retrieves the active authentication bearer token from local storage.
   * @returns JWT token string if authenticated, or null.
   */
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ardhnarishwar_token');
  }

  /**
   * Builds HTTP headers for API requests, attaching the JWT Bearer authorization token
   * and setting Content-Type when appropriate.
   * @param isFormData - Whether the payload is multipart form-data.
   * @returns Complete headers configuration.
   */
  private static getHeaders(isFormData: boolean = false): HeadersInit {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Core request executor with content negotiation, response parsing, and error normalization.
   * @param endpoint - Relative or absolute endpoint URI.
   * @param options - Standard fetch RequestInit parameters.
   * @returns Promise resolving to an ApiResponse envelope.
   */
  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...(options.headers || {}),
      },
    };

    try {
      const res = await fetch(url, config);
      let data: unknown;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      if (!res.ok) {
        const errorDetail =
          typeof data === 'object' && data !== null && 'detail' in data
            ? String((data as { detail: unknown }).detail)
            : typeof data === 'string' && data.length > 0
            ? data
            : `Request failed with status ${res.status}`;
        return { error: errorDetail, status: res.status };
      }

      return { data: data as T, status: res.status };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Network error: Failed to connect to backend server.';
      return {
        error: message,
        status: 0,
      };
    }
  }

  /**
   * Executes an HTTP GET request with optional query string parameter serialization.
   * @param endpoint - Target API endpoint.
   * @param params - Key-value map of query parameters.
   */
  static get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Executes an HTTP POST request, serializing JSON payloads or forwarding FormData.
   * @param endpoint - Target API endpoint.
   * @param body - Request payload object or FormData.
   */
  static post<T = any>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });
  }

  /**
   * Executes an HTTP PUT request, serializing JSON payloads or forwarding FormData.
   * @param endpoint - Target API endpoint.
   * @param body - Request payload object or FormData.
   */
  static put<T = any>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });
  }

  /**
   * Executes an HTTP DELETE request.
   * @param endpoint - Target API endpoint.
   */
  static delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // High-Level Domain Methods: Resumes & Document Vault
  // ============================================================================

  /**
   * Uploads a candidate resume document (PDF, DOCX) to the backend multi-tenant vault.
   * @param file - Binary File handle to upload.
   * @param candidateId - Optional target candidate identifier.
   * @param companyId - Optional tenant company identifier.
   */
  static async uploadResume(file: File, candidateId?: string, companyId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (candidateId) formData.append('candidate_id', candidateId);
    if (companyId) formData.append('company_id', companyId);
    return this.post('/api/v1/resumes/upload', formData);
  }

  /**
   * Lists resume records with filtering, searching, and pagination.
   */
  static async listResumes(params?: {
    search?: string;
    status_filter?: string;
    company_id?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.get('/api/v1/resumes', params);
  }

  /**
   * Permanently deletes a stored resume record and associated file storage.
   */
  static async deleteResume(resumeId: string) {
    return this.delete(`/api/v1/resumes/${resumeId}`);
  }

  // ============================================================================
  // High-Level Domain Methods: Jobs & Benchmark Question Bank
  // ============================================================================

  /**
   * Retrieves positions across the tenant or global repository with optional status and search filters.
   */
  static async listJobs(params?: {
    company_id?: string;
    status_filter?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.get('/api/v1/jobs', params);
  }

  /**
   * Fetches full specification and rubric details for a specific job position.
   */
  static async getJob(jobId: string) {
    return this.get(`/api/v1/jobs/${jobId}`);
  }

  /**
   * Provisions a new job requisition with skill category and interview rounds.
   */
  static async createJob(payload: CreateJobPayload) {
    return this.post('/api/v1/jobs', payload);
  }

  /**
   * Removes a job position from the tenant roster.
   */
  static async deleteJob(jobId: string) {
    return this.delete(`/api/v1/jobs/${jobId}`);
  }

  /**
   * Fetches linked evaluation questions for a specific job opening.
   */
  static async getJobQuestions(jobId: string) {
    return this.get(`/api/v1/jobs/${jobId}/questions`);
  }

  /**
   * Attaches a new benchmark question to an existing job specification.
   */
  static async addJobQuestion(jobId: string, questionPayload: AddQuestionPayload) {
    return this.post(`/api/v1/jobs/${jobId}/questions`, questionPayload);
  }

  // ============================================================================
  // High-Level Domain Methods: Candidates & Applications
  // ============================================================================

  /**
   * Registers a candidate application for an active job opening.
   */
  static async applyForJob(payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    job_id: string;
    skill_category?: string;
    years_of_experience?: number;
    skills?: string[];
    resume_id?: string;
    password?: string;
  }) {
    return this.post('/api/v1/candidates/apply', payload);
  }

  /**
   * Retrieves candidate applicant pipelines across companies or specific jobs.
   */
  static async listCandidates(params?: {
    company_id?: string;
    job_id?: string;
    status_filter?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.get('/api/v1/candidates', params);
  }

  /**
   * Updates a candidate's pipeline status stage (e.g., SCREENING, INTERVIEWED, HIRED).
   */
  static async updateCandidateStatus(candidateId: string, status: string) {
    return this.put(`/api/v1/candidates/${candidateId}/status`, { status });
  }

  // ============================================================================
  // High-Level Domain Methods: Live AI Interview Chamber
  // ============================================================================

  /**
   * Authenticates and initiates an AI assessment session using the unique invitation token.
   */
  static async initiateInterview(token: string) {
    return this.post('/api/v1/interviews/sessions/initiate', { token });
  }

  /**
   * Submits a recorded spoken transcript and video timestamp markers for an interview answer.
   */
  static async submitAnswer(
    sessionId: string,
    payload: {
      question_id: string;
      transcript: string;
      duration_seconds: number;
      video_timestamp_start?: number;
      video_timestamp_end?: number;
    }
  ) {
    return this.post(`/api/v1/interviews/sessions/${sessionId}/answer`, payload);
  }

  /**
   * Finalizes an active assessment session, triggering AI evaluation scoring and report compilation.
   */
  static async completeInterview(
    sessionId: string,
    diagnostics?: CompleteInterviewPayload
  ) {
    return this.post(`/api/v1/interviews/sessions/${sessionId}/complete`, {
      system_diagnostics: diagnostics,
    });
  }

  /**
   * Retrieves the comprehensive AI score report and proctoring telemetry for a session.
   */
  static async getInterviewReport(sessionId: string) {
    return this.get(`/api/v1/interviews/sessions/${sessionId}/report`);
  }

  // ============================================================================
  // High-Level Domain Methods: Analytics & Tenant Administration
  // ============================================================================

  /**
   * Retrieves global platform health, active users, and system analytics for Super Admins.
   */
  static async getSuperAdminStats() {
    return this.get('/api/v1/stats/super-admin');
  }

  /**
   * Retrieves company-level recruitment funnel metrics and proctoring statistics.
   */
  static async getCompanyStats(companyId?: string) {
    return this.get('/api/v1/stats/company', { company_id: companyId });
  }

  /**
   * Lists all enterprise tenants and organizations registered on the platform.
   */
  static async listCompanies() {
    return this.get('/api/v1/companies');
  }

  /**
   * Decommissions an enterprise company account and revokes active tenant access.
   */
  static async deleteCompany(companyId: string) {
    return this.delete(`/api/v1/companies/${companyId}`);
  }

  /**
   * Retrieves full organizational profile and workspace settings for a company.
   */
  static async getCompany(companyId: string) {
    return this.get(`/api/v1/companies/${companyId}`);
  }

  /**
   * Persists comprehensive organization profile metadata and workspace parameters.
   */
  static async updateCompanySettings(companyId: string, data: any) {
    return this.put(`/api/v1/companies/${companyId}`, data);
  }

  // ============================================================================
  // High-Level Domain Methods: Multi-Engine AI Co-Pilot & Video Vault
  // ============================================================================

  /**
   * Lists available multi-engine AI models (Claude, Gemini, HuggingFace, Local).
   */
  static async getAiModels() {
    return this.get('/api/v1/ai/models');
  }

  /**
   * Sends prompt to Multi-Engine Co-pilot with automatic fallback cascade.
   */
  static async sendCopilotMessage(payload: {
    prompt: string;
    mode?: string;
    model_id?: string;
    stream?: boolean;
    history?: any[];
    company_name?: string;
  }) {
    return this.post('/api/v1/ai/copilot/chat', payload);
  }

  /**
   * Triggers or indexes an interview recording into the AI Video Vault.
   */
  static async indexVideoVault(sessionId: string) {
    return this.post(`/api/v1/recordings/${sessionId}/index-vault`);
  }

  /**
   * Retrieves key moments, transcription, and behavioral highlights from the AI Video Vault.
   */
  static async getVideoVaultData(sessionId: string) {
    return this.get(`/api/v1/recordings/${sessionId}/vault-data`);
  }
}

