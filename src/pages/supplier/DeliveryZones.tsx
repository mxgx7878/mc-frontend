// src/pages/supplier/DeliveryZones.tsx
import DashboardLayout from '../../components/layout/DashboardLayout';
import DeliveryZonesManagement from '../../components/supplier/DeliveryZonesManagement';
import {supplierMenuItems} from '../../utils/menuItems';

const DeliveryZonesPage = () => {

  return (
    <DashboardLayout menuItems={supplierMenuItems}>
      <DeliveryZonesManagement />
    </DashboardLayout>
  );
};

export default DeliveryZonesPage;