// FILE PATH: src/components/admin/Dashboard/ChartsSection.tsx

/**
 * Charts Section Component
 * Displays all dashboard charts (Revenue, Status, Suppliers, Products, Price Distribution)
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { Chart } from '../../../api/handlers/adminDashboard.api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsSectionProps {
  charts: Chart[];
  loading: boolean;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ charts, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card p-6">
            <div className="h-80 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!charts || charts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 text-center">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  const renderChart = (chart: Chart) => {
    const { id, type, labels, series } = chart;

    // Donut Chart (Order Status)
    if (type === 'donut' && Array.isArray(series) && typeof series[0] === 'number') {
      const data = {
        labels,
        datasets: [
          {
            data: series as unknown as number[],
            backgroundColor: [
              '#3B82F6', // blue
              '#10B981', // green
              '#F59E0B', // amber
              '#EF4444', // red
              '#8B5CF6', // purple
              '#06B6D4', // cyan
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 15,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      };

      return (
        <div className="h-80">
          <Doughnut data={data} options={options} />
        </div>
      );
    }

    // Line/Area Chart (Revenue Over Time)
    if (id === 'time_revenue' && Array.isArray(series) && series[0]?.data) {
      const data = {
        labels,
        datasets: series.map((s, idx) => ({
          label: s.name,
          data: s.data,
          borderColor: idx === 0 ? '#3B82F6' : '#10B981',
          backgroundColor: idx === 0 
            ? 'rgba(59, 130, 246, 0.1)' 
            : 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: idx === 0 ? 'y' : 'y1',
        })),
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: {
              display: true,
              text: 'Revenue',
            },
          },
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            title: {
              display: true,
              text: 'Orders',
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top' as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (context.datasetIndex === 0) {
                    label += new Intl.NumberFormat('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                    }).format(context.parsed.y);
                  } else {
                    label += context.parsed.y + ' orders';
                  }
                }
                return label;
              },
            },
          },
        },
      };

      return (
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
      );
    }

    // Bar Chart (Suppliers, Products, Price Distribution)
    if (Array.isArray(series) && series[0]?.data) {
      const data = {
        labels,
        datasets: series.map((s) => ({
          label: s.name,
          data: s.data,
          backgroundColor: '#3B82F6',
          borderRadius: 6,
        })),
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (id === 'supplier_revenue') {
                    label += new Intl.NumberFormat('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                    }).format(context.parsed.y);
                  } else {
                    label += context.parsed.y;
                  }
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                if (id === 'supplier_revenue') {
                  return new Intl.NumberFormat('en-AU', {
                    style: 'currency',
                    currency: 'AUD',
                    notation: 'compact',
                  }).format(value);
                }
                return value;
              },
            },
          },
        },
      };

      return (
        <div className="h-80">
          <Bar data={data} options={options} />
        </div>
      );
    }

    return <div className="h-80 flex items-center justify-center text-gray-500">Chart data unavailable</div>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart) => (
        <div key={chart.id} className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
          {renderChart(chart)}
        </div>
      ))}
    </div>
  );
};

export default ChartsSection;
