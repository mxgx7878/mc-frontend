// src/routes/index.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Import pages
import Login from '../pages/public/Login';
import RegisterClient from '../pages/public/RegisterClient';
import RegisterSupplier from '../pages/public/RegisterSupplier';

import ClientDashboard from '../pages/client/Dashboard';
import SupplierDashboard from '../pages/supplier/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';

// Admin - User Management
import UserManagement from '../pages/admin/UserManagement';
import UserDetail from '../pages/admin/UserDetail';
import UserEdit from '../pages/admin/UserEdit';
import UserCreate from '../pages/admin/UserCreate';

//Admin Supplier Delivery Zones
import AdminSupplierDeliveryZones from '../pages/admin/AdminSupplierDeliveryZones';

//Admin Master Products
import MasterProductsList from '../pages/admin/MasterProducts/MasterProductsList';
import AddMasterProduct from '../pages/admin/MasterProducts/AddMasterProduct';
import EditMasterProduct from '../pages/admin/MasterProducts/EditMasterProduct';
import ViewMasterProduct from '../pages/admin/MasterProducts/ViewMasterProduct';

//Admin Orders
import AdminOrdersList from '../pages/admin/Orders/AdminOrdersList';
import AdminOrderView from '../pages/admin/Orders/AdminOrderView';

//Client Projects
import ProjectsList from '../pages/client/projects/ProjectsList';
import ProjectDetail from '../pages/client/projects/ProjectDetail';
import ProjectEdit from '../pages/client/projects/ProjectEdit';
import ProjectCreate from '../pages/client/projects/ProjectCreate';

//Client Orders
import OrderCreate from '../pages/client/OrderCreate';
import ClientOrders from '../pages/client/ClientOrders';
import ClientOrderView from '../pages/client/ClientOrderView';

//Supplier Delivery Zones
import DeliveryZonesPage from '../pages/supplier/DeliveryZones';
import ProductManagement from '../pages/supplier/ProductManagement';

//Supplier Orders
import SupplierOrders from '../pages/supplier/SupplierOrders';
import SupplierOrderDetail from '../pages/supplier/SupplierOrderDetail';

// Shared
import ProfileSettings from '../pages/shared/ProfileSettings';
const basePath = import.meta.env.VITE_BASE_PATH || '/';

const AppRouter = () => {
  return (
      <BrowserRouter basename={basePath}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/client" element={<RegisterClient />} />
        <Route path="/register/supplier" element={<RegisterSupplier />} />

        {/* Client Routes */}
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/profile"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/projects"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ProjectsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/projects/create"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ProjectCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/client/orders/create" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <OrderCreate />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/client/projects/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ProjectEdit />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/client/orders" 
          element={
          <ProtectedRoute allowedRoles={['client']}>
          <ClientOrders />
          </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/orders/:orderId" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
            <ClientOrderView />
            </ProtectedRoute>
          } 
        />


        {/* Supplier Routes */}
        <Route
          path="/supplier/dashboard"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <SupplierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/profile"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/zones"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <DeliveryZonesPage />
            </ProtectedRoute>
          }
        />
        <Route
            path="/supplier/products"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <ProductManagement />
              </ProtectedRoute>
            }
          />
        <Route
          path="/supplier/orders"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <SupplierOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <SupplierOrderDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - IMPORTANT: ORDER MATTERS! */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* NEW: Supplier Delivery Zones */}
        <Route
          path="/admin/supplier-zones"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <AdminSupplierDeliveryZones />
            </ProtectedRoute>
          }
        />

        {/* User Management - Specific routes BEFORE dynamic :id */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        
        {/* CREATE - Must come before :id */}
        <Route
          path="/admin/users/create"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <UserCreate />
            </ProtectedRoute>
          }
        />
        
        {/* EDIT - Must come before plain :id */}
        <Route
          path="/admin/users/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <UserEdit />
            </ProtectedRoute>
          }
        />
        
        {/* VIEW - Dynamic route comes LAST */}
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <UserDetail />
            </ProtectedRoute>
          }
        />

        {/* Master Products Routes */}
        <Route
          path="/admin/master-products"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <MasterProductsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/master-products/add"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <AddMasterProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/master-products/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <EditMasterProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/master-products/view/:id"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <ViewMasterProduct />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        {/* Admin Order Routes */}
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <AdminOrdersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['admin','support','accountant']}>
              <AdminOrderView />
            </ProtectedRoute>
          }
        />
        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;