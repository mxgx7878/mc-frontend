// src/pages/client/projects/ProjectEdit.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useProject, useUpdateProject } from '../../../features/projects/hooks';
import ProjectForm from '../../../features/components/ProjectForm';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {clientMenuItems} from '../../../utils/menuItems';
export default function ProjectEdit() {
  const { id } = useParams();
  const pid = Number(id);
  const { data, isLoading } = useProject(pid);
  const navigate = useNavigate();
  const mut = useUpdateProject(pid);

  if (isLoading) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-secondary-600">Loading project details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="text-center py-12">
          <p className="text-error-500 mb-4 text-xl">❌ Project not found</p>
          <button
            onClick={() => navigate('/client/projects')}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>
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
            onClick={() => navigate(`/client/projects/`)}
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
            <p className="text-secondary-600 mt-2">Update project information</p>
          </div>

          <ProjectForm
            initial={{
              name: data.name,
              site_contact_name: data.site_contact_name || undefined,
              site_contact_phone: data.site_contact_phone || undefined,
              site_instructions: data.site_instructions || undefined
            }}
            onSubmit={(v) => mut.mutate(v, {
              onSuccess: () => {
                toast.success('✅ Project updated successfully!');
                // ✅ Navigate back to detail view
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