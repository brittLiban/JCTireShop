'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Pencil, Trash2, Users, DollarSign, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type PayType        = 'HOURLY' | 'SALARY'
type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
type PayRecordType  = 'PAYROLL' | 'BONUS' | 'EXPENSE' | 'DEDUCTION'

interface PayRecord {
  id:          string
  type:        PayRecordType
  amount:      string
  hours?:      string | null
  periodStart?: string | null
  periodEnd?:   string | null
  notes?:       string | null
  paidAt:       string
}

interface Employee {
  id:         string
  name:       string
  role?:      string | null
  phone?:     string | null
  email?:     string | null
  payType:    PayType
  payRate:    string
  startDate?: string | null
  status:     EmployeeStatus
  notes?:     string | null
  payRecords: PayRecord[]
}

const PAY_TYPE_LABELS: Record<PayRecordType, { label: string; color: string }> = {
  PAYROLL:   { label: 'Payroll',   color: 'bg-blue-50 text-blue-700' },
  BONUS:     { label: 'Bonus',     color: 'bg-emerald-50 text-emerald-700' },
  EXPENSE:   { label: 'Expense',   color: 'bg-purple-50 text-purple-700' },
  DEDUCTION: { label: 'Deduction', color: 'bg-red-50 text-red-600' },
}

function thisMonthTotal(records: PayRecord[]): number {
  const now = new Date()
  return records
    .filter((r) => {
      const d = new Date(r.paidAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s, r) => {
      const amt = parseFloat(r.amount)
      return r.type === 'DEDUCTION' ? s - amt : s + amt
    }, 0)
}

function allTimeTotal(records: PayRecord[]): number {
  return records.reduce((s, r) => {
    const amt = parseFloat(r.amount)
    return r.type === 'DEDUCTION' ? s - amt : s + amt
  }, 0)
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function EmployeesPage() {
  const [employees,   setEmployees]   = useState<Employee[]>([])
  const [loading,     setLoading]     = useState(true)
  const [expanded,    setExpanded]    = useState<string | null>(null)

  // Employee modal
  const [empModal,    setEmpModal]    = useState(false)
  const [editingEmp,  setEditingEmp]  = useState<Employee | null>(null)
  const [savingEmp,   setSavingEmp]   = useState(false)
  const [empName,     setEmpName]     = useState('')
  const [empRole,     setEmpRole]     = useState('')
  const [empPhone,    setEmpPhone]    = useState('')
  const [empEmail,    setEmpEmail]    = useState('')
  const [empPayType,  setEmpPayType]  = useState<PayType>('HOURLY')
  const [empPayRate,  setEmpPayRate]  = useState('')
  const [empStart,    setEmpStart]    = useState('')
  const [empStatus,   setEmpStatus]   = useState<EmployeeStatus>('ACTIVE')
  const [empNotes,    setEmpNotes]    = useState('')

  // Pay modal
  const [payModal,    setPayModal]    = useState(false)
  const [payTarget,   setPayTarget]   = useState<Employee | null>(null)
  const [savingPay,   setSavingPay]   = useState(false)
  const [payType,     setPayType]     = useState<PayRecordType>('PAYROLL')
  const [payHours,    setPayHours]    = useState('')
  const [payAmount,   setPayAmount]   = useState('')
  const [payDate,     setPayDate]     = useState('')
  const [payPeriodS,  setPayPeriodS]  = useState('')
  const [payPeriodE,  setPayPeriodE]  = useState('')
  const [payNotes,    setPayNotes]    = useState('')

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/employees')
      if (!res.ok) throw new Error()
      setEmployees(await res.json())
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  // ── Employee modal ─────────────────────────────────────
  const openAddEmp = () => {
    setEditingEmp(null)
    setEmpName(''); setEmpRole(''); setEmpPhone(''); setEmpEmail('')
    setEmpPayType('HOURLY'); setEmpPayRate(''); setEmpStart('')
    setEmpStatus('ACTIVE'); setEmpNotes('')
    setEmpModal(true)
  }

  const openEditEmp = (e: Employee) => {
    setEditingEmp(e)
    setEmpName(e.name); setEmpRole(e.role ?? ''); setEmpPhone(e.phone ?? '')
    setEmpEmail(e.email ?? ''); setEmpPayType(e.payType)
    setEmpPayRate(parseFloat(e.payRate).toString())
    setEmpStart(e.startDate ? e.startDate.slice(0, 10) : '')
    setEmpStatus(e.status); setEmpNotes(e.notes ?? '')
    setEmpModal(true)
  }

  const saveEmployee = async () => {
    if (!empName.trim()) { toast.error('Name is required'); return }
    if (!empPayRate || parseFloat(empPayRate) <= 0) { toast.error('Pay rate is required'); return }
    setSavingEmp(true)
    const payload = {
      name: empName.trim(), role: empRole.trim() || null, phone: empPhone.trim() || null,
      email: empEmail.trim() || null, payType: empPayType,
      payRate: parseFloat(empPayRate), startDate: empStart || null,
      status: empStatus, notes: empNotes.trim() || null,
    }
    try {
      const url    = editingEmp ? `/api/admin/employees/${editingEmp.id}` : '/api/admin/employees'
      const method = editingEmp ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(editingEmp ? 'Employee updated!' : 'Employee added!')
      setEmpModal(false)
      fetchEmployees()
    } catch { toast.error('Failed to save.') }
    finally { setSavingEmp(false) }
  }

  const deleteEmployee = async (e: Employee) => {
    if (!confirm(`Remove ${e.name} from staff? This will also delete all their pay records.`)) return
    try {
      const res = await fetch(`/api/admin/employees/${e.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setEmployees((prev) => prev.filter((x) => x.id !== e.id))
      toast.success('Employee removed.')
    } catch { toast.error('Failed to delete.') }
  }

  // ── Pay modal ──────────────────────────────────────────
  const openPayModal = (e: Employee) => {
    setPayTarget(e)
    setPayType('PAYROLL')
    setPayHours(''); setPayAmount(''); setPayNotes('')
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayPeriodS(''); setPayPeriodE('')
    setPayModal(true)
  }

  // Auto-compute amount when hours change for hourly employees
  const onHoursChange = (val: string) => {
    setPayHours(val)
    if (payTarget?.payType === 'HOURLY' && payType === 'PAYROLL') {
      const h = parseFloat(val)
      const r = parseFloat(payTarget.payRate)
      if (!isNaN(h) && !isNaN(r)) setPayAmount((h * r).toFixed(2))
    }
  }

  const savePay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) { toast.error('Amount is required'); return }
    setSavingPay(true)
    const payload = {
      type: payType, amount: parseFloat(payAmount),
      hours: payHours ? parseFloat(payHours) : null,
      periodStart: payPeriodS || null, periodEnd: payPeriodE || null,
      paidAt: payDate || new Date().toISOString(),
      notes: payNotes.trim() || null,
    }
    try {
      const res = await fetch(`/api/admin/employees/${payTarget!.id}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success('Pay record added!')
      setPayModal(false)
      fetchEmployees()
    } catch { toast.error('Failed to save.') }
    finally { setSavingPay(false) }
  }

  const deletePayRecord = async (emp: Employee, recId: string) => {
    if (!confirm('Delete this pay record?')) return
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}/pay/${recId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setEmployees((prev) => prev.map((e) =>
        e.id === emp.id ? { ...e, payRecords: e.payRecords.filter((r) => r.id !== recId) } : e
      ))
      toast.success('Record deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  // ── Stats ──────────────────────────────────────────────
  const activeCount  = employees.filter((e) => e.status === 'ACTIVE').length
  const monthlyTotal = employees.reduce((s, e) => s + thisMonthTotal(e.payRecords), 0)
  const yearTotal    = employees.reduce((s, e) => {
    const now = new Date()
    return s + e.payRecords
      .filter((r) => new Date(r.paidAt).getFullYear() === now.getFullYear())
      .reduce((rs, r) => r.type === 'DEDUCTION' ? rs - parseFloat(r.amount) : rs + parseFloat(r.amount), 0)
  }, 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeCount} active · {employees.length} total
          </p>
        </div>
        <button onClick={openAddEmp} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users,      label: 'Active Staff',     value: activeCount.toString(),   color: 'bg-blue-50 text-blue-600' },
          { icon: DollarSign, label: 'Payroll This Month', value: `$${fmt(monthlyTotal)}`, color: 'bg-amber-50 text-amber-600' },
          { icon: DollarSign, label: 'Payroll This Year',  value: `$${fmt(yearTotal)}`,    color: 'bg-purple-50 text-purple-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={14} />
            </div>
            <p className="text-base sm:text-lg font-black text-brand-dark leading-tight">{value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Employee table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="px-6 py-12 text-center text-gray-400">Loading employees...</p>
        ) : employees.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No employees yet. Add your first staff member.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {employees.map((e) => {
              const isOpen   = expanded === e.id
              const monthly  = thisMonthTotal(e.payRecords)
              const total    = allTimeTotal(e.payRecords)
              return (
                <div key={e.id}>
                  {/* Employee row */}
                  <div className={clsx('px-4 py-3 hover:bg-gray-50/60 transition-colors', e.status === 'INACTIVE' && 'opacity-60')}>
                    <div className="flex items-center gap-3">

                      {/* Expand toggle */}
                      <button type="button" onClick={() => setExpanded(isOpen ? null : e.id)}
                        className="p-1 text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-brand-dark flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{e.name.slice(0, 1).toUpperCase()}</span>
                      </div>

                      {/* Name / Role */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-brand-dark">{e.name}</p>
                          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded',
                            e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                            {e.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {e.role || 'No role'} ·{' '}
                          <span className="font-mono">
                            ${parseFloat(e.payRate).toFixed(2)}/{e.payType === 'HOURLY' ? 'hr' : 'mo'}
                          </span>
                        </p>
                      </div>

                      {/* Cost columns — hidden on mobile */}
                      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">This month</p>
                          <p className="text-sm font-bold text-brand-dark">${fmt(monthly)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">All time</p>
                          <p className="text-sm font-bold text-brand-dark">${fmt(total)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openPayModal(e)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-dark hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                          <Plus size={11} /> Log Pay
                        </button>
                        <button onClick={() => openEditEmp(e)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteEmployee(e)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-brand-red transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile cost display */}
                    <div className="sm:hidden flex gap-4 mt-2 pl-[3.25rem]">
                      <div>
                        <p className="text-[10px] text-gray-400">This month</p>
                        <p className="text-sm font-bold text-brand-dark">${fmt(monthly)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">All time</p>
                        <p className="text-sm font-bold text-brand-dark">${fmt(total)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pay records (expanded) */}
                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100 px-4 py-3">
                      {e.payRecords.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">No pay records yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 font-semibold uppercase tracking-wide">
                                <th className="pb-2 pr-4 text-left">Date</th>
                                <th className="pb-2 pr-4 text-left">Type</th>
                                <th className="pb-2 pr-4 text-left">Hours</th>
                                <th className="pb-2 pr-4 text-right">Amount</th>
                                <th className="pb-2 pr-4 text-left">Notes</th>
                                <th className="pb-2" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {e.payRecords.map((r) => {
                                const info = PAY_TYPE_LABELS[r.type]
                                const isDeduction = r.type === 'DEDUCTION'
                                return (
                                  <tr key={r.id}>
                                    <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">
                                      {new Date(r.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-1.5 pr-4">
                                      <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', info.color)}>{info.label}</span>
                                    </td>
                                    <td className="py-1.5 pr-4 text-gray-500 text-center">
                                      {r.hours ? `${parseFloat(r.hours).toFixed(1)}h` : '—'}
                                    </td>
                                    <td className={clsx('py-1.5 pr-4 text-right font-semibold', isDeduction ? 'text-red-600' : 'text-brand-dark')}>
                                      {isDeduction ? '-' : '+'}${fmt(parseFloat(r.amount))}
                                    </td>
                                    <td className="py-1.5 pr-4 text-gray-400 max-w-[160px]">
                                      <span className="truncate block">{r.notes || '—'}</span>
                                    </td>
                                    <td className="py-1.5">
                                      <button onClick={() => deletePayRecord(e, r.id)}
                                        className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={11} />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <button onClick={() => openPayModal(e)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-brand-dark font-semibold py-1.5 px-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Plus size={11} /> Log pay for {e.name}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Employee Modal ─────────────────────── */}
      {empModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEmpModal(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-brand-dark">{editingEmp ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setEmpModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Full Name *</label>
                  <input value={empName} onChange={(e) => setEmpName(e.target.value)} className="admin-input" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="admin-label">Role / Position</label>
                  <input value={empRole} onChange={(e) => setEmpRole(e.target.value)} className="admin-input" placeholder="Tire Technician" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Phone</label>
                  <input value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} className="admin-input" placeholder="(514) 555-0100" />
                </div>
                <div>
                  <label className="admin-label">Email</label>
                  <input value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className="admin-input" placeholder="jane@example.com" type="email" />
                </div>
              </div>

              <div>
                <label className="admin-label">Pay Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'HOURLY', label: 'Hourly',  sub: 'Paid per hour worked' },
                    { value: 'SALARY', label: 'Salary',  sub: 'Fixed monthly amount' },
                  ] as { value: PayType; label: string; sub: string }[]).map(({ value, label, sub }) => (
                    <button key={value} type="button" onClick={() => setEmpPayType(value)}
                      className={clsx('flex flex-col items-center py-2.5 rounded-xl border-2 transition-all',
                        empPayType === value ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}>
                      <span className="font-bold text-sm">{label}</span>
                      <span className={clsx('text-[10px] mt-0.5', empPayType === value ? 'opacity-70' : 'text-gray-400')}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">
                    {empPayType === 'HOURLY' ? 'Hourly Rate ($)' : 'Monthly Salary ($)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input value={empPayRate} onChange={(e) => setEmpPayRate(e.target.value)}
                      className="admin-input pl-6" placeholder={empPayType === 'HOURLY' ? '18.00' : '3500.00'} type="number" step="0.01" />
                  </div>
                </div>
                <div>
                  <label className="admin-label">Start Date</label>
                  <input value={empStart} onChange={(e) => setEmpStart(e.target.value)} className="admin-input" type="date" />
                </div>
              </div>

              <div>
                <label className="admin-label">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'ACTIVE',   label: 'Active',   active: 'bg-green-500 border-green-500 text-white' },
                    { value: 'INACTIVE', label: 'Inactive', active: 'bg-gray-500 border-gray-500 text-white'  },
                  ] as { value: EmployeeStatus; label: string; active: string }[]).map(({ value, label, active }) => (
                    <button key={value} type="button" onClick={() => setEmpStatus(value)}
                      className={clsx('py-2 rounded-xl border-2 font-semibold text-sm transition-all',
                        empStatus === value ? active : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="admin-label">Notes</label>
                <input value={empNotes} onChange={(e) => setEmpNotes(e.target.value)} className="admin-input" placeholder="Any notes…" />
              </div>

              <div className="flex gap-3 pt-1 pb-safe">
                <button type="button" onClick={() => setEmpModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={saveEmployee} disabled={savingEmp}
                  className="flex-1 bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60">
                  {savingEmp ? 'Saving…' : editingEmp ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Pay Modal ───────────────────────────────── */}
      {payModal && payTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPayModal(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-lg text-brand-dark">Log Pay</h2>
                <p className="text-xs text-gray-400 mt-0.5">{payTarget.name} · ${parseFloat(payTarget.payRate).toFixed(2)}/{payTarget.payType === 'HOURLY' ? 'hr' : 'mo'}</p>
              </div>
              <button onClick={() => setPayModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">

              {/* Pay type */}
              <div>
                <label className="admin-label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'PAYROLL',   label: 'Payroll',   color: 'bg-blue-600 border-blue-600 text-white' },
                    { value: 'BONUS',     label: 'Bonus',     color: 'bg-emerald-600 border-emerald-600 text-white' },
                    { value: 'EXPENSE',   label: 'Expense',   color: 'bg-purple-600 border-purple-600 text-white' },
                    { value: 'DEDUCTION', label: 'Deduction', color: 'bg-red-600 border-red-600 text-white' },
                  ] as { value: PayRecordType; label: string; color: string }[]).map(({ value, label, color }) => (
                    <button key={value} type="button" onClick={() => setPayType(value)}
                      className={clsx('py-2 rounded-xl border-2 font-semibold text-sm transition-all',
                        payType === value ? color : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours (hourly + payroll only) */}
              {payTarget.payType === 'HOURLY' && payType === 'PAYROLL' && (
                <div>
                  <label className="admin-label flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400" />
                    Hours Worked <span className="text-gray-400 font-normal">(auto-calculates amount)</span>
                  </label>
                  <input value={payHours} onChange={(e) => onHoursChange(e.target.value)}
                    className="admin-input" placeholder="40" type="number" step="0.5" />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="admin-label">Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                    className="admin-input pl-6 text-lg font-bold" placeholder="0.00" type="number" step="0.01" />
                </div>
              </div>

              {/* Date + Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Date Paid</label>
                  <input value={payDate} onChange={(e) => setPayDate(e.target.value)} className="admin-input" type="date" />
                </div>
                <div>
                  <label className="admin-label">Notes</label>
                  <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="admin-input" placeholder="e.g. Week of May 5" />
                </div>
              </div>

              <div className="flex gap-3 pt-1 pb-safe">
                <button type="button" onClick={() => setPayModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={savePay} disabled={savingPay}
                  className="flex-1 bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-black transition-colors disabled:opacity-60">
                  {savingPay ? 'Saving…' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
