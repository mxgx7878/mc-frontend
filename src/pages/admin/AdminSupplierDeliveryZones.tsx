// src/pages/admin/AdminSupplierDeliveryZones.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Grid3X3,
  Map as MapIcon,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Package,
  ShoppingCart,
  Settings,
  BarChart,
  MapPin,
} from 'lucide-react';

import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSupplierZonesStats from '../../components/admin/AdminSupplierZonesStats';
import SupplierZoneCard from '../../components/admin/SupplierZoneCard';
import AdminSupplierZonesMapView from '../../components/admin/AdminSupplierZonesMapView';
import { adminSupplierZonesAPI } from '../../api/handlers/adminSupplierZones.api';

// Generate consistent random color per supplier
const generateSupplierColor = (supplierId: number): string => {
  const colors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
    '#EF4444', '#EC4899', '#14B8A6', '#F97316',
    '#6366F1', '#84CC16', '#F43F5E', '#06B6D4',
    '#8B5CF6', '#F59E0B', '#10B981', '#EF4444',
  ];
  return colors[supplierId % colors.length];
};

const AdminSupplierDeliveryZones = () => {
  const [activeView, setActiveView] = useState<'card' | 'map'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'Products', path: '/admin/products', icon: <Package size={20} /> },
    { label: 'Supplier Delivery Zones', path: '/admin/supplier-zones', icon: <MapPin size={20} /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <BarChart size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  // Fetch suppliers with zones
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-supplier-zones', page, perPage, searchTerm],
    queryFn: () => adminSupplierZonesAPI.getSuppliersWithZones({
      page,
      per_page: perPage,
      search: searchTerm || undefined,
    }),
    keepPreviousData: true,
  });

  // Generate color map for suppliers
  const supplierColors = useMemo(() => {
    const colorMap = new Map<number, string>();
    data?.data.forEach((supplier) => {
      colorMap.set(supplier.id, generateSupplierColor(supplier.id));
    });
    return colorMap;
  }, [data]);

  const suppliers = data?.data || [];
  const pagination = {
    currentPage: data?.current_page || 1,
    lastPage: data?.last_page || 1,
    total: data?.total || 0,
    from: data?.from || 0,
    to: data?.to || 0,
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1); // Reset to first page
  };

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="min-h-screen bg-secondary-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                <MapPin size={32} className="text-primary-600" />
                Supplier Delivery Zones
              </h1>
              <p className="text-secondary-600 mt-2">
                View and analyze supplier service areas across the platform
              </p>
            </div>
          </div>

          {/* Stats Card */}
          {!isLoading && !error && (
            <AdminSupplierZonesStats 
              suppliers={suppliers} 
              totalSuppliers={pagination.total} 
            />
          )}

          {/* Search & View Toggle */}
          <div className="bg-white rounded-xl border-2 border-secondary-200 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" 
                  size={20} 
                />
                <input
                  type="text"
                  placeholder="Search suppliers by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
              </div>

              {/* View Toggle */}
              <div className="bg-white rounded-xl border-2 border-secondary-200 p-2 inline-flex gap-2">
                <button
                  onClick={() => setActiveView('card')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                    activeView === 'card'
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  <Grid3X3 size={20} />
                  Card View
                </button>
                <button
                  onClick={() => setActiveView('map')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                    activeView === 'map'
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  <MapIcon size={20} />
                  Map View
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-primary-600 animate-spin mb-4" />
              <p className="text-secondary-600">Loading supplier delivery zones...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-xl p-6 text-center">
              <AlertCircle size={48} className="text-error-500 mx-auto mb-4" />
              <p className="text-error-700 font-medium">Failed to load supplier zones</p>
              <p className="text-error-600 text-sm mt-2">{(error as Error).message}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && suppliers.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-dashed border-secondary-300 p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
                <MapPin size={48} className="text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                No Suppliers Found
              </h3>
              <p className="text-secondary-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? `No suppliers match "${searchTerm}"`
                  : 'No suppliers with delivery zones found in the system'}
              </p>
            </div>
          )}

          {/* Card View */}
          {!isLoading && !error && activeView === 'card' && suppliers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <SupplierZoneCard
                  key={supplier.id}
                  supplier={supplier}
                  color={supplierColors.get(supplier.id) || '#3B82F6'}
                />
              ))}
            </div>
          )}

          {/* Map View */}
          {!isLoading && !error && activeView === 'map' && suppliers.length > 0 && (
            <AdminSupplierZonesMapView 
              suppliers={suppliers} 
              supplierColors={supplierColors}
            />
          )}

          {/* Pagination */}
          {!isLoading && !error && suppliers.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-secondary-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary-600">
                  Showing {pagination.from} to {pagination.to} of {pagination.total} suppliers
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Per Page Selector */}
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="text-sm text-secondary-700 px-3">
                    Page {pagination.currentPage} of {pagination.lastPage}
                  </span>

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.lastPage}
                    className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSupplierDeliveryZones;