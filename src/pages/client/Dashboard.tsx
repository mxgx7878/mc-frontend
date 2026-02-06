// FILE PATH: src/pages/client/Dashboard.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Formatter } from 'recharts/types/component/DefaultTooltipContent';
import {
  Package,
  Clock,
  Truck,
  Layers,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../utils/menuItems';
import {
  clientDashboardAPI,
  type ClientDashboardParams,
  type TodayDelivery,
  type RecentOrder,
  type MonthlyPerDay,
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

const ORDER_STATUS_BADGE: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Confirmed: 'bg-blue-100 text-blue-800',
  Scheduled: 'bg-indigo-100 text-indigo-800',
  'In Transit': 'bg-amber-100 text-amber-800',
  Delivered: 'bg-green-100 text-green-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Paid: 'bg-green-100 text-green-800',
  'Partially Paid': 'bg-orange-100 text-orange-800',
  Requested: 'bg-purple-100 text-purple-800',
};

// ==================== HELPERS ====================

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
};

const formatDayOnly = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.getDate().toString();
};

const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
};

const pieTooltipFormatter: Formatter<number, string> = (value, name) => {
  return [String(value ?? 0), String(name ?? '')];
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

const MonthlyChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-gray-700">{formatDate(label)}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

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
      <td className="px-4 py-3 text-sm text-gray-700">{delivery.project?.name || '—'}</td>
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
      <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-500">
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

// Recent order card
const RecentOrderCard = ({ order }: { order: RecentOrder }) => {
  const orderBadge = ORDER_STATUS_BADGE[order.order_status] || 'bg-gray-100 text-gray-700';
  const paymentBadge = PAYMENT_STATUS_BADGE[order.payment_status] || 'bg-gray-100 text-gray-700';

  const confirmedRatio =
    order.delivery_slots_total > 0
      ? Math.round((order.delivery_slots_confirmed / order.delivery_slots_total) * 100)
      : 0;

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
            {order.po_number && (
              <span className="truncate text-xs text-gray-400">PO: {order.po_number}</span>
            )}
            {order.repeat_order && (
              <span title="Repeat order">
                <Repeat size={12} className="shrink-0 text-blue-400" />
              </span>
            )}
          </div>
          {order.project?.name && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{order.project.name}</p>
          )}
        </div>
        <span className="whitespace-nowrap text-xs text-gray-400">{timeAgo(order.created_at)}</span>
      </div>

      {/* Products */}
      <div className="mb-3 space-y-1">
        {order.products.slice(0, 2).map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="truncate text-gray-700">{p.product_name}</span>
            <span className="ml-2 whitespace-nowrap text-xs font-medium text-gray-500">
              x{p.quantity}
            </span>
          </div>
        ))}
        {order.products.length > 2 && (
          <p className="text-xs text-gray-400">+{order.products.length - 2} more items</p>
        )}
      </div>

      {/* Delivery confirmation indicator */}
      {order.delivery_slots_total > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">Supplier Confirmed</span>
            <span className="text-xs font-medium text-gray-700">
              {order.delivery_slots_confirmed}/{order.delivery_slots_total}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                confirmedRatio === 100 ? 'bg-green-500' : confirmedRatio > 0 ? 'bg-amber-400' : 'bg-gray-300'
              }`}
              style={{ width: `${confirmedRatio}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${orderBadge}`}>
            {order.order_status}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentBadge}`}>
            {order.payment_status}
          </span>
        </div>
        {order.total_price > 0 && (
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(order.total_price)}
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const ClientDashboard = () => {
  const [days, setDays] = useState(14);
  const [chartMode, setChartMode] = useState<'count' | 'qty'>('count');
  const [month, setMonth] = useState(getCurrentMonth());

  const params: ClientDashboardParams = { days, month };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['client-dashboard', params],
    queryFn: () => clientDashboardAPI.getDashboard(params),
    refetchOnWindowFocus: false,
    staleTime: 3 * 60 * 1000,
  });

  const stats = data?.data?.stats;
  const todaysDeliveries = data?.data?.todays_deliveries || [];
  const deliveriesPerDay = data?.data?.graphs?.deliveries_per_day || [];
  const deliveryStatuses = data?.data?.graphs?.delivery_statuses || [];

  // NEW
  const monthlySummary = data?.data?.monthly?.summary;
  const monthlyPerDay = data?.data?.monthly?.per_day || [];
  const recentOrders = data?.data?.recent_orders || [];

  // Filter out days with zero deliveries for cleaner chart (optional: keep all for full month view)
  const monthlyChartData: MonthlyPerDay[] = monthlyPerDay;

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

        {/* ============ CHARTS ROW (existing) ============ */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonChart />
            </div>
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Deliveries Trend (Area) */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 lg:col-span-2">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-gray-800">Deliveries Trend</h2>
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

            {/* Delivery Status Breakdown (Pie) */}
            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-800">Delivery Status</h2>

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
                      formatter={pieTooltipFormatter}
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

        {/* ============ MONTHLY DELIVERIES (NEW) ============ */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          {/* Month header with navigation */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Monthly Deliveries</h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Confirmed vs unconfirmed delivery slots
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth(shiftMonth(month, -1))}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[140px] text-center text-sm font-medium text-gray-700">
                {formatMonthLabel(month)}
              </span>
              <button
                onClick={() => setMonth(shiftMonth(month, 1))}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
              {month !== getCurrentMonth() && (
                <button
                  onClick={() => setMonth(getCurrentMonth())}
                  className="ml-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Monthly summary pills */}
          {monthlySummary && !isLoading && (
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5">
                <Truck size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Total:</span>
                <span className="text-xs font-semibold text-gray-800">
                  {monthlySummary.total_deliveries}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-xs text-green-700">Confirmed:</span>
                <span className="text-xs font-semibold text-green-800">
                  {monthlySummary.confirmed_count}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5">
                <AlertCircle size={14} className="text-amber-600" />
                <span className="text-xs text-amber-700">Unconfirmed:</span>
                <span className="text-xs font-semibold text-amber-800">
                  {monthlySummary.unconfirmed_count}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5">
                <Layers size={14} className="text-blue-600" />
                <span className="text-xs text-blue-700">Total Qty:</span>
                <span className="text-xs font-semibold text-blue-800">
                  {monthlySummary.total_qty}
                </span>
              </div>
            </div>
          )}

          {/* Monthly stacked bar chart */}
          {isLoading ? (
            <div className="h-64 animate-pulse rounded bg-gray-100" />
          ) : monthlyChartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              No deliveries this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyChartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayOnly}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MonthlyChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 8 }}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
                <Bar
                  dataKey="confirmed"
                  name="Confirmed"
                  stackId="deliveries"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="unconfirmed"
                  name="Unconfirmed"
                  stackId="deliveries"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ============ RECENT ORDERS + TODAY'S DELIVERIES ROW (NEW LAYOUT) ============ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Recent Orders — 2 cols */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-800">Recent Orders</h2>
                  {!isLoading && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {recentOrders.length}
                    </span>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package size={40} className="mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">No orders yet</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Your recent orders will appear here
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] space-y-3 overflow-y-auto p-4">
                  {recentOrders.map((order) => (
                    <RecentOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's Deliveries Table — 3 cols */}
          <div className="lg:col-span-3">
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
                  <p className="text-sm font-medium text-gray-500">
                    No deliveries scheduled for today
                  </p>
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
          </div>
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