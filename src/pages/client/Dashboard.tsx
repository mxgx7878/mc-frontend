// FILE PATH: src/pages/client/Dashboard.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  Package,
  Clock,
  Truck,
  Layers,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  MapPin,
  Eye,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../utils/menuItems';
import {
  clientDashboardAPI,
  type ClientDashboardParams,
  type TodayDelivery,
} from '../../api/handlers/clientDashboard.api';

// ==================== CONSTANTS ====================

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 60 days', value: 60 },
  { label: 'Last 90 days', value: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3b82f6',
  'in-transit': '#f59e0b',
  in_transit: '#f59e0b',
  delivered: '#10b981',
  cancelled: '#ef4444',
  pending: '#8b5cf6',
  failed: '#ef4444',
  completed: '#10b981',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const DELIVERY_STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  'in-transit': 'bg-amber-100 text-amber-800',
  in_transit: 'bg-amber-100 text-amber-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

// ==================== HELPERS ====================

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
};

const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '—';
  // timeStr could be "HH:mm" or "HH:mm:ss"
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/[_-]/g, ' ');

// ==================== SUB-COMPONENTS ====================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    valueText: 'text-blue-700',
    border: 'border-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    valueText: 'text-green-700',
    border: 'border-green-100',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    valueText: 'text-amber-700',
    border: 'border-amber-100',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    valueText: 'text-purple-700',
    border: 'border-purple-100',
  },
};

const StatCard = ({ title, value, subtitle, icon, color }: StatCardProps) => {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`mt-1 text-3xl font-bold ${c.valueText}`}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg ${c.iconBg} p-2.5`}>
          <span className={c.iconText}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

// Custom tooltip for area chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-gray-700">{formatDate(label)}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// Delivery row for today's deliveries table
const DeliveryRow = ({ delivery }: { delivery: TodayDelivery }) => {
  const statusClass =
    DELIVERY_STATUS_BADGE[delivery.status?.toLowerCase()] || 'bg-gray-100 text-gray-800';

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
        #{delivery.order_id}
        {delivery.po_number && (
          <span className="ml-1.5 text-xs text-gray-400">({delivery.po_number})</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {delivery.product?.product_name || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {delivery.project?.name || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {delivery.supplier?.company_name || '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
        {delivery.qty}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
        {formatTime(delivery.delivery_time)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
        >
          {capitalize(delivery.status || 'scheduled')}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
        {delivery.delivery_address ? (
          <span className="flex items-center gap-1">
            <MapPin size={12} className="shrink-0 text-gray-400" />
            {delivery.delivery_address}
          </span>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
};

// ==================== MAIN COMPONENT ====================

const ClientDashboard = () => {
  const [days, setDays] = useState(14);
  const [chartMode, setChartMode] = useState<'count' | 'qty'>('count');

  const params: ClientDashboardParams = { days };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['client-dashboard', params],
    queryFn: () => clientDashboardAPI.getDashboard(params),
    refetchOnWindowFocus: false,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const stats = data?.data?.stats;
  const todaysDeliveries = data?.data?.todays_deliveries || [];
  const deliveriesPerDay = data?.data?.graphs?.deliveries_per_day || [];
  const deliveryStatuses = data?.data?.graphs?.delivery_statuses || [];

  // ==================== LOADING SKELETON ====================
  const SkeletonCard = () => (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-8 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-10 rounded-lg bg-gray-200" />
      </div>
    </div>
  );

  const SkeletonChart = () => (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-6">
      <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
      <div className="h-64 rounded bg-gray-100" />
    </div>
  );

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* ============ PAGE HEADER ============ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Overview of your orders and deliveries
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Range Selector */}
            <div className="relative">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ============ STAT CARDS ============ */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={stats?.total_orders ?? 0}
              subtitle="All time"
              icon={<Package size={20} />}
              color="blue"
            />
            <StatCard
              title="Open Orders"
              value={stats?.open_orders ?? 0}
              subtitle="In progress"
              icon={<Clock size={20} />}
              color="amber"
            />
            <StatCard
              title="Today's Deliveries"
              value={stats?.todays_deliveries_count ?? 0}
              subtitle={`${stats?.todays_deliveries_qty ?? 0} total qty`}
              icon={<Truck size={20} />}
              color="green"
            />
            <StatCard
              title="Today's Quantity"
              value={stats?.todays_deliveries_qty ?? 0}
              subtitle="Units scheduled today"
              icon={<Layers size={20} />}
              color="purple"
            />
          </div>
        )}

        {/* ============ CHARTS ROW ============ */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonChart />
            </div>
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ---------- Deliveries Trend (Area + Bar) ---------- */}
            <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Deliveries Trend
                </h2>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  <button
                    onClick={() => setChartMode('count')}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      chartMode === 'count'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Count
                  </button>
                  <button
                    onClick={() => setChartMode('qty')}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      chartMode === 'qty'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Quantity
                  </button>
                </div>
              </div>

              {deliveriesPerDay.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No delivery data for this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={deliveriesPerDay}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={chartMode === 'count' ? 'deliveries_count' : 'total_qty'}
                      name={chartMode === 'count' ? 'Deliveries' : 'Total Qty'}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#gradBlue)"
                      dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ---------- Delivery Status Breakdown (Pie) ---------- */}
            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-800">
                Delivery Status
              </h2>

              {deliveryStatuses.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No status data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={deliveryStatuses.map((s) => ({
                        name: capitalize(s.status || 'scheduled'),
                        value: s.count,
                      }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {deliveryStatuses.map((s, i) => (
                        <Cell
                          key={s.status}
                          fill={
                            STATUS_COLORS[s.status?.toLowerCase()] ||
                            PIE_COLORS[i % PIE_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-gray-600">{value}</span>
                      )}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}`, name]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ============ TODAY'S DELIVERIES TABLE ============ */}
        <div className="rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-gray-500" />
              <h2 className="text-base font-semibold text-gray-800">Today's Deliveries</h2>
              {!isLoading && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {todaysDeliveries.length}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-gray-100" />
              ))}
            </div>
          ) : todaysDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Truck size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No deliveries scheduled for today</p>
              <p className="mt-1 text-xs text-gray-400">
                Deliveries will appear here when they are scheduled
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Order
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Project
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Time
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todaysDeliveries.map((delivery) => (
                    <DeliveryRow key={delivery.id} delivery={delivery} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============ RANGE FOOTER ============ */}
        {stats && (
          <div className="text-center text-xs text-gray-400">
            Showing data from {stats.range_from} to {stats.range_to} ({stats.range_days} days)
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;