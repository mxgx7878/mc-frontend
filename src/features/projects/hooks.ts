// --- src/features/projects/hooks.ts ---
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, ProjectDTO, ProjectCreateInput, ProjectUpdateInput, Paginated } from '../../api/handlers/projects.api';
import { projectKeys } from './queryKeys';

export const useProjects = (params: Record<string, unknown>) =>
  useQuery<Paginated<ProjectDTO>>({ queryKey: projectKeys.list(params), queryFn: () => projectsAPI.list(params), keepPreviousData: true });

export const useProject = (id?: number) =>
  useQuery<ProjectDTO>({ queryKey: id ? projectKeys.detail(id) : ['projects','detail','idle'], queryFn: () => projectsAPI.get(id!), enabled: !!id });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreateInput) => projectsAPI.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
};

export const useUpdateProject = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreateInput) => projectsAPI.update({ id, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsAPI.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
};
