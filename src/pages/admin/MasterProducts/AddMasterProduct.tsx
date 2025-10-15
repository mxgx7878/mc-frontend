// FILE PATH: src/pages/admin/MasterProducts/AddMasterProduct.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronRight, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../../utils/menuItems';
import { 
  masterProductsAPI, 
  type CreateMasterProductPayload 
} from '../../../api/handlers/masterProducts.api';

type FormData = {
  product_name: string;
  product_type: string;
  specifications: string;
  unit_of_measure: string;
  category: number;
  photo?: FileList;
  tech_doc?: FileList;
};

const AddMasterProduct = () => {
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [techDocName, setTechDocName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>();


  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => masterProductsAPI.getCategories(),
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMasterProductPayload) => masterProductsAPI.create(data),
    onSuccess: () => {
      toast.success('Product created successfully!');
      navigate('/admin/master-products');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  // Handle photo preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should not exceed 2MB');
        setValue('photo', undefined);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tech doc change
  const handleTechDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Document size should not exceed 5MB');
        setValue('tech_doc', undefined);
        return;
      }
      setTechDocName(file.name);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setPhotoPreview(null);
    setValue('photo', undefined);
  };

  // Remove tech doc
  const removeTechDoc = () => {
    setTechDocName(null);
    setValue('tech_doc', undefined);
  };

  // Form submit
  const onSubmit = (data: FormData) => {
    const payload: CreateMasterProductPayload = {
      product_name: data.product_name,
      product_type: data.product_type,
      specifications: data.specifications,
      unit_of_measure: data.unit_of_measure,
      category: Number(data.category),
      photo: data.photo?.[0] || null,
      tech_doc: data.tech_doc?.[0] || null,
    };

    createMutation.mutate(payload);
  };

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-secondary-500">
            <li>
              <Link to="/admin/master-products" className="hover:text-primary-600 transition-colors">
                Master Products
              </Link>
            </li>
            <li>
              <ChevronRight size={16} />
            </li>
            <li className="text-secondary-900 font-medium">Add Product</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Add New Product</h1>
          <p className="text-secondary-600 mt-2">
            Create a new master product in the catalog
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-card p-8">
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('product_name', { required: 'Product name is required' })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.product_name ? 'border-red-500' : 'border-secondary-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.product_name && (
                <p className="mt-1 text-sm text-red-500">{errors.product_name.message}</p>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Product Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('product_type', { required: 'Product type is required' })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.product_type ? 'border-red-500' : 'border-secondary-300'
                }`}
                placeholder="e.g., Gravel, Sand, Concrete"
              />
              {errors.product_type && (
                <p className="mt-1 text-sm text-red-500">{errors.product_type.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                disabled={categoriesLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.category ? 'border-red-500' : 'border-secondary-300'
                }`}
              >
                <option value="">Select category</option>
                {categoriesData?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Unit of Measure */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('unit_of_measure', { required: 'Unit of measure is required' })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.unit_of_measure ? 'border-red-500' : 'border-secondary-300'
                }`}
                placeholder="e.g., ton, kg, Cubic Meter"
              />
              {errors.unit_of_measure && (
                <p className="mt-1 text-sm text-red-500">{errors.unit_of_measure.message}</p>
              )}
            </div>

            {/* Specifications */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Specifications <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('specifications', { required: 'Specifications are required' })}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none ${
                  errors.specifications ? 'border-red-500' : 'border-secondary-300'
                }`}
                placeholder="Enter detailed product specifications"
              />
              {errors.specifications && (
                <p className="mt-1 text-sm text-red-500">{errors.specifications.message}</p>
              )}
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Product Photo
              </label>
              
              {photoPreview ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-secondary-200">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon size={40} className="text-secondary-400 mb-3" />
                    <p className="mb-2 text-sm text-secondary-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-secondary-500">PNG, JPG or GIF (MAX. 2MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    {...register('photo')}
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Tech Doc Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Technical Document
              </label>
              
              {techDocName ? (
                <div className="flex items-center justify-between p-4 border-2 border-secondary-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText size={24} className="text-primary-500" />
                    <span className="text-sm text-secondary-700">{techDocName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeTechDoc}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <Upload size={32} className="text-secondary-400 mb-2" />
                    <p className="text-sm text-secondary-500">
                      <span className="font-semibold">Upload document</span>
                    </p>
                    <p className="text-xs text-secondary-500">PDF, DOCX or XLSX (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx"
                    {...register('tech_doc')}
                    onChange={handleTechDocChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-secondary-200">
            <Link
              to="/admin/master-products"
              className="px-6 py-3 text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddMasterProduct;