// --- src/api/handlers/projects.api.ts ---
import api from '../axios.config';

export interface ProjectDTO {
  id: number;
  name: string;
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  site_instructions?: string | null;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number
  added_by: number;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> { data: T[]; meta: { page: number; per_page: number; total: number } }

export type ProjectCreateInput = {
  name: string;
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  site_instructions?: string | null;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number;
};

export type ProjectUpdateInput = Partial<ProjectCreateInput> & { id: number };

const BASE = '/projects';

export const projectsAPI = {
  list: (params: Record<string, unknown>) => api.get<Paginated<ProjectDTO>>(BASE, { params }).then(r => r.data),
  get:  (id: number) => api.get<ProjectDTO>(`${BASE}/${id}`).then(r => r.data),
  create: (payload: ProjectCreateInput) => api.post<ProjectDTO>(BASE, payload).then(r => r.data),
  update: ({ id, ...payload }: ProjectUpdateInput) => api.post<ProjectDTO>(`${BASE}/${id}`, payload).then(r => r.data),
  remove: (id: number) => api.delete(`${BASE}/${id}`).then(r => r.data),
};