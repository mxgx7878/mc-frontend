// src/pages/client/projects/ProjectCreate.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { useCreateProject } from '../../../features/projects/hooks';
import ProjectForm from '../../../features/components/ProjectForm';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../../utils/menuItems';

export default function ProjectCreate() {
  const navigate = useNavigate();
  const mut = useCreateProject();

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/client/projects')}
            className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900">Create New Project</h1>
            <p className="text-secondary-600 mt-2">Add a new construction project with delivery location</p>
          </div>

          <ProjectForm
            onSubmit={(v) => mut.mutate(v, {
              onSuccess: () => {
                toast.success('✅ Project created successfully!');
                navigate('/client/projects');
              },
              onError: (e: any) => {
                toast.error(e?.message || 'Failed to create project');
              },
            })}
            submitting={mut.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}