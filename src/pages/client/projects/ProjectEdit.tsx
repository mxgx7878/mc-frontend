// src/pages/client/projects/ProjectEdit.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useProject, useUpdateProject } from '../../../features/projects/hooks';
import ProjectForm from '../../../features/components/ProjectForm';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../../utils/menuItems';

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id, 10) : undefined;
  
  const { data, isLoading, error } = useProject(projectId);
  const mut = useUpdateProject(projectId!);

  if (isLoading) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="text-center text-red-600 py-8">
          Failed to load project
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/client/projects/${id}`)}
            className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Project Details
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900">Edit Project</h1>
            <p className="text-secondary-600 mt-2">Update project information and delivery location</p>
          </div>

          <ProjectForm
            initial={{
              name: data.name,
              site_contact_name: data.site_contact_name || undefined,
              site_contact_phone: data.site_contact_phone || undefined,
              site_instructions: data.site_instructions || undefined,
              delivery_address: data.delivery_address || undefined,
              delivery_lat: data.delivery_lat || undefined,
              delivery_long: data.delivery_long || undefined,
            }}
            onSubmit={(v) => mut.mutate(v, {
              onSuccess: () => {
                toast.success('✅ Project updated successfully!');
                navigate(`/client/projects/${id}`);
              },
              onError: (e: any) => {
                toast.error(e?.message || 'Failed to update project');
              },
            })}
            submitting={mut.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}