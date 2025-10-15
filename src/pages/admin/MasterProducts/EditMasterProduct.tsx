// FILE PATH: src/pages/admin/MasterProducts/EditMasterProduct.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronRight, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../../utils/menuItems';
import { 
  masterProductsAPI, 
  type UpdateMasterProductPayload 
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

const EditMasterProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [techDocName, setTechDocName] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [existingTechDoc, setExistingTechDoc] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>();

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['masterProduct', id],
    queryFn: () => masterProductsAPI.getById(Number(id)),
    enabled: !!id,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => masterProductsAPI.getCategories(),
  });

  // Pre-fill form when product data loads
  useEffect(() => {
    if (product) {
      reset({
        product_name: product.product_name,
        product_type: product.product_type,
        specifications: product.specifications,
        unit_of_measure: product.unit_of_measure,
        category: product.category.id,
      });

      // Set existing files
      if (product.photo) {
        const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
        setExistingPhoto(`${baseURL}/storage/${product.photo}`);
      }
      if (product.tech_doc) {
        setExistingTechDoc(product.tech_doc.split('/').pop() || null);
      }
    }
  }, [product, reset]);

  // Update product mutation (for form fields only)
  const updateMutation = useMutation({
    mutationFn: (data: UpdateMasterProductPayload) => 
      masterProductsAPI.update(Number(id), data),
    onSuccess: () => {
      toast.success('Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['masterProducts'] });
      queryClient.invalidateQueries({ queryKey: ['masterProduct', id] });
      navigate('/admin/master-products');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });

  // Toggle approval mutation (separate from update)
  const toggleApprovalMutation = useMutation({
    mutationFn: () => masterProductsAPI.toggleApproval(Number(id)),
    onSuccess: () => {
      toast.success('Product approval status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['masterProduct', id] });
      queryClient.invalidateQueries({ queryKey: ['masterProducts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update approval status');
    },
  });

  // Handle photo change
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
        setExistingPhoto(null);
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
      setExistingTechDoc(null);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setPhotoPreview(null);
    setExistingPhoto(null);
    setValue('photo', undefined);
  };

  // Remove tech doc
  const removeTechDoc = () => {
    setTechDocName(null);
    setExistingTechDoc(null);
    setValue('tech_doc', undefined);
  };

  // Form submit (for product details only)
  const onSubmit = (data: FormData) => {
    const payload: UpdateMasterProductPayload = {
      product_name: data.product_name,
      product_type: data.product_type,
      specifications: data.specifications,
      unit_of_measure: data.unit_of_measure,
      category: Number(data.category),
    };

    // Only include files if new ones are uploaded
    if (data.photo?.[0]) {
      payload.photo = data.photo[0];
    }
    if (data.tech_doc?.[0]) {
      payload.tech_doc = data.tech_doc[0];
    }

    updateMutation.mutate(payload);
  };

  if (productLoading) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="flex items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="text-center py-12">
          <p className="text-gray-600">Product not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link to="/admin/master-products" className="hover:text-blue-600 transition-colors">
                  Master Products
                </Link>
              </li>
              <li>
                <ChevronRight size={16} />
              </li>
              <li className="text-gray-900 font-medium">Edit Product</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600 mt-2">
              Update product information
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-8">
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('product_name', { required: 'Product name is required' })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.product_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.product_name.message}</p>
                )}
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('product_type', { required: 'Product type is required' })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.product_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Gravel, Sand, Concrete"
                />
                {errors.product_type && (
                  <p className="mt-1 text-sm text-red-500">{errors.product_type.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit of Measure <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('unit_of_measure', { required: 'Unit of measure is required' })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.unit_of_measure ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., ton, kg, Cubic Meter"
                />
                {errors.unit_of_measure && (
                  <p className="mt-1 text-sm text-red-500">{errors.unit_of_measure.message}</p>
                )}
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specifications <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('specifications', { required: 'Specifications are required' })}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    errors.specifications ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter detailed product specifications"
                />
                {errors.specifications && (
                  <p className="mt-1 text-sm text-red-500">{errors.specifications.message}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Photo
                </label>
                
                {photoPreview || existingPhoto ? (
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={photoPreview || existingPhoto || ''} 
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
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon size={40} className="text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 2MB)</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Document
                </label>
                
                {techDocName || existingTechDoc ? (
                  <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText size={24} className="text-blue-500" />
                      <span className="text-sm text-gray-700">
                        {techDocName || existingTechDoc}
                      </span>
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
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Upload document</span>
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOCX or XLSX (MAX. 5MB)</p>
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

            {/* Approval Status Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Product Approval Status</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Control whether this product is active and visible to clients
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleApprovalMutation.mutate()}
                  disabled={toggleApprovalMutation.isPending}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    product.is_approved === 1
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {toggleApprovalMutation.isPending ? 'Updating...' : (product.is_approved === 1 ? 'Mark as Inactive' : 'Mark as Active')}
                </button>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  product.is_approved === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Current Status: {product.is_approved === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <Link
                to="/admin/master-products"
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditMasterProduct;