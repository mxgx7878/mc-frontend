// src/components/admin/AdminSupplierZonesStats.tsx
import React, { useMemo } from 'react';
import { Users, MapPin, Layers, TrendingUp } from 'lucide-react';
import type { SupplierWithZones } from '../../api/handlers/adminSupplierZones.api';

interface StatsProps {
  suppliers: SupplierWithZones[];
  totalSuppliers: number;
}

const AdminSupplierZonesStats: React.FC<StatsProps> = ({ suppliers, totalSuppliers }) => {
  const stats = useMemo(() => {
    const totalZones = suppliers.reduce((sum, s) => sum + s.delivery_zones.length, 0);
    
    const totalCoverage = suppliers.reduce((sum, supplier) => {
      const supplierCoverage = supplier.delivery_zones.reduce((zoneSum, zone) => {
        return zoneSum + (Math.PI * zone.radius * zone.radius);
      }, 0);
      return sum + supplierCoverage;
    }, 0);

    const allRadii = suppliers.flatMap(s => s.delivery_zones.map(z => z.radius));
    const avgRadius = allRadii.length > 0 
      ? allRadii.reduce((sum, r) => sum + r, 0) / allRadii.length 
      : 0;

    const suppliersWithZones = suppliers.filter(s => s.delivery_zones.length > 0).length;
    const suppliersWithoutZones = totalSuppliers - suppliersWithZones;

    return {
      totalSuppliers,
      totalZones,
      totalCoverage: totalCoverage.toFixed(0),
      avgRadius: avgRadius.toFixed(1),
      suppliersWithZones,
      suppliersWithoutZones,
    };
  }, [suppliers, totalSuppliers]);

  const statCards = [
    {
      icon: Users,
      label: 'Total Suppliers',
      value: stats.totalSuppliers,
      subtext: `${stats.suppliersWithZones} with zones`,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      icon: MapPin,
      label: 'Total Zones',
      value: stats.totalZones,
      subtext: `Across ${stats.suppliersWithZones} suppliers`,
      bgColor: 'bg-success-100',
      iconColor: 'text-success-600',
    },
    {
      icon: Layers,
      label: 'Total Coverage',
      value: `${stats.totalCoverage} km²`,
      subtext: 'Combined area',
      bgColor: 'bg-warning-100',
      iconColor: 'text-warning-600',
    },
    {
      icon: TrendingUp,
      label: 'Avg Radius',
      value: `${stats.avgRadius} km`,
      subtext: 'Per delivery zone',
      bgColor: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-secondary-200 p-6">
      <h2 className="text-lg font-bold text-secondary-900 mb-4">System Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={24} className={stat.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-secondary-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-secondary-900 truncate">{stat.value}</p>
              <p className="text-xs text-secondary-500">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.suppliersWithoutZones > 0 && (
        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-sm text-warning-700">
            ⚠️ <strong>{stats.suppliersWithoutZones}</strong> supplier{stats.suppliersWithoutZones > 1 ? 's' : ''} without delivery zones
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSupplierZonesStats;