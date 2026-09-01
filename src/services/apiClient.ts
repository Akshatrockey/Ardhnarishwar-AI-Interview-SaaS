/**
 * Ardhnarishwar Enterprise API Client
 * Robust, typed REST client connecting frontend portals directly to FastAPI backend endpoints.
 * Automatically manages JWT Bearer tokens, multi-part form payloads, and error interception.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ardhnarishwar_token');
  }

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
        ...(options.headers || {})
      }
    };

    try {
      const res = await fetch(url, config);
      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      if (!res.ok) {
        const errorDetail = (typeof data === 'object' && data?.detail) 
          ? data.detail 
          : (typeof data === 'string' ? data : `Request failed with status ${res.status}`);
        return { error: errorDetail, status: res.status };
      }

      return { data, status: res.status };
    } catch (err: any) {
      return {
        error: err.message || 'Network error: Failed to connect to backend server.',
        status: 0
      };
    }
  }

  static get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
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

  static post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  static put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  static delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // High-Level Domain Methods
  // ============================================================================

  // Resumes
  static async uploadResume(file: File, candidateId?: string, companyId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (candidateId) formData.append('candidate_id', candidateId);
    if (companyId) formData.append('company_id', companyId);
    return this.post('/api/v1/resumes/upload', formData);
  }

  static async listResumes(params?: { search?: string; status_filter?: string; company_id?: string; limit?: number; offset?: number }) {
    return this.get('/api/v1/resumes', params);
  }

  static async deleteResume(resumeId: string) {
    return this.delete(`/api/v1/resumes/${resumeId}`);
  }

  // Jobs & Questions
  static async listJobs(params?: { company_id?: string; status_filter?: string; search?: string; limit?: number; offset?: number }) {
    return this.get('/api/v1/jobs', params);
  }

  static async getJob(jobId: string) {
    return this.get(`/api/v1/jobs/${jobId}`);
  }

  static async createJob(payload: any) {
    return this.post('/api/v1/jobs', payload);
  }

  static async deleteJob(jobId: string) {
    return this.delete(`/api/v1/jobs/${jobId}`);
  }

  static async getJobQuestions(jobId: string) {
    return this.get(`/api/v1/jobs/${jobId}/questions`);
  }

  static async addJobQuestion(jobId: string, questionPayload: any) {
    return this.post(`/api/v1/jobs/${jobId}/questions`, questionPayload);
  }

  // Candidates & Applications
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

  static async listCandidates(params?: { company_id?: string; job_id?: string; status_filter?: string; search?: string; limit?: number; offset?: number }) {
    return this.get('/api/v1/candidates', params);
  }

  static async updateCandidateStatus(candidateId: string, status: string) {
    return this.put(`/api/v1/candidates/${candidateId}/status`, { status });
  }

  // Live Interview Chamber
  static async initiateInterview(token: string) {
    return this.post('/api/v1/interviews/sessions/initiate', { token });
  }

  static async submitAnswer(sessionId: string, payload: {
    question_id: string;
    transcript: string;
    duration_seconds: number;
    video_timestamp_start?: number;
    video_timestamp_end?: number;
  }) {
    return this.post(`/api/v1/interviews/sessions/${sessionId}/answer`, payload);
  }

  static async completeInterview(sessionId: string, diagnostics?: any) {
    return this.post(`/api/v1/interviews/sessions/${sessionId}/complete`, { system_diagnostics: diagnostics });
  }

  static async getInterviewReport(sessionId: string) {
    return this.get(`/api/v1/interviews/sessions/${sessionId}/report`);
  }

  // Stats
  static async getSuperAdminStats() {
    return this.get('/api/v1/stats/super-admin');
  }

  static async getCompanyStats(companyId?: string) {
    return this.get('/api/v1/stats/company', { company_id: companyId });
  }

  // Companies
  static async listCompanies() {
    return this.get('/api/v1/companies');
  }

  static async deleteCompany(companyId: string) {
    return this.delete(`/api/v1/companies/${companyId}`);
  }
}
