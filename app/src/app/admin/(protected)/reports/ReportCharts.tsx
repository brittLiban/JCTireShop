'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

interface MonthData {
  month: string
  inventory: number
  payroll: number
  staffExp: number
  overhead: number
  total: number
}

interface CategoryData {
  label: string
  amount: number
  color: string
}

interface Props {
  byMonth: MonthData[]
  byCategory: CategoryData[]
}

function dollarTick(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return `$${v}`
}

function dollarFmt(v: unknown) {
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ReportCharts({ byMonth, byCategory }: Props) {
  return (
    <div className="grid lg:grid-cols-5 gap-6">

      {/* MOM stacked bar — wider */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-brand-dark text-sm mb-4">Monthly Spending</h3>
        {byMonth.every((m) => m.total === 0) ? (
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No data for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byMonth} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={dollarTick} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val, name) => [dollarFmt(val), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="inventory" stackId="a" name="Inventory"    fill="#3b82f6" />
              <Bar dataKey="payroll"   stackId="a" name="Payroll"      fill="#8b5cf6" />
              <Bar dataKey="staffExp"  stackId="a" name="Staff Exp"    fill="#f59e0b" />
              <Bar dataKey="overhead"  stackId="a" name="Overhead"     fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Donut breakdown — narrower */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-brand-dark text-sm mb-4">By Category</h3>
        {byCategory.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="amount"
                nameKey="label"
                cx="50%"
                cy="45%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {byCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => dollarFmt(val)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span style={{ color: '#6b7280' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
