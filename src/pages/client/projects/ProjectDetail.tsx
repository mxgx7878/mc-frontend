// src/pages/client/projects/ProjectDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  ShoppingCart, 
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Phone,
  FileText,
  Calendar,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useProject, useDeleteProject } from '../../../features/projects/hooks';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Button from '../../../components/common/Buttons';
import { clientMenuItems } from '../../../utils/menuItems';

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pid = Number(id);
  const { data, isLoading } = useProject(pid);
  const deleteMutation = useDeleteProject();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${data?.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(pid, {
        onSuccess: () => {
          toast.success('✅ Project deleted successfully');
          navigate('/client/projects');
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to delete project');
        },
      });
    }
  };

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/client/projects')}
            className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/client/projects/${id}/edit`)}
              variant="outline"
              fullWidth={false}
            >
              <Edit2 size={18} />
              Edit Project
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              fullWidth={false}
              className="text-error-600 border-error-600 hover:bg-error-50"
              disabled={deleteMutation.isPending }
            >
              <Trash2 size={18} />
              {deleteMutation.isPending  ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Project Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                <FolderOpen size={40} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{data.name}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Created {formatDate(data.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 space-y-8">
            {/* Site Contact Information */}
            <div>
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                <User size={24} className="text-primary-600" />
                Site Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 py-4 border-b border-secondary-100">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-secondary-500 mb-1">Contact Name</p>
                    <p className="text-base font-medium text-secondary-900">
                      {data.site_contact_name || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-4 border-b border-secondary-100">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-secondary-500 mb-1">Contact Phone</p>
                    <p className="text-base font-medium text-secondary-900">
                      {data.site_contact_phone || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Instructions */}
            <div className="border-t border-secondary-200 pt-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                <FileText size={24} className="text-primary-600" />
                Site Instructions
              </h2>
              {data.site_instructions ? (
                <div className="bg-secondary-50 rounded-xl p-6 border border-secondary-200">
                  <p className="text-secondary-700 whitespace-pre-wrap leading-relaxed">
                    {data.site_instructions}
                  </p>
                </div>
              ) : (
                <div className="bg-secondary-50 rounded-xl p-6 border border-secondary-200 text-center">
                  <p className="text-secondary-500">No site instructions provided</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-secondary-200 pt-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                <Calendar size={24} className="text-primary-600" />
                Project Timeline
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary-50 rounded-xl p-4 border border-secondary-200">
                  <p className="text-sm text-secondary-500 mb-1">Created</p>
                  <p className="text-base font-medium text-secondary-900">
                    {formatDate(data.created_at)}
                  </p>
                </div>
                <div className="bg-secondary-50 rounded-xl p-4 border border-secondary-200">
                  <p className="text-sm text-secondary-500 mb-1">Last Updated</p>
                  <p className="text-base font-medium text-secondary-900">
                    {formatDate(data.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Future: Orders Section */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Project Orders</h2>
          <div className="text-center py-8 bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200">
            <ShoppingCart size={48} className="text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600">No orders yet for this project</p>
            <Button
              onClick={() => toast('Order creation coming soon!')}
              variant="outline"
              fullWidth={false}
              className="mt-4"
            >
              Create Order
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}