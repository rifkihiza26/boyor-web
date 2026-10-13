'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { Employee, UserRole } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge, AccountStatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Power,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function EmployeesManagementPage() {
  const { allEmployees, refreshData } = useAuth();
  const { showToast } = useToast();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Employee Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering & Product');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const filteredEmployees = allEmployees.filter((emp) => {
    if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) return false;
    if (roleFilter !== 'ALL' && emp.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchCode = emp.employeeCode.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      return matchName || matchCode || matchEmail;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setEmployeeCode(`BYR-00${allEmployees.length + 1}`);
    setFullName('');
    setEmail('');
    setDepartment('Engineering & Product');
    setJobTitle('');
    setRole('EMPLOYEE');
    setPhone('0812-3344-5566');
    setBankName('BCA');
    setAccountNumber('');
    setAccountHolder('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeCode(emp.employeeCode);
    setFullName(emp.fullName);
    setEmail(emp.email);
    setDepartment(emp.department);
    setJobTitle(emp.jobTitle);
    setRole(emp.role);
    setPhone(emp.phone || '');
    setBankName(emp.bankAccount?.bankName || 'BCA');
    setAccountNumber(emp.bankAccount?.accountNumber || '');
    setAccountHolder(emp.bankAccount?.accountHolder || emp.fullName);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!fullName.trim() || !email.trim()) {
      showToast('Nama dan Email wajib diisi.', 'error');
      return;
    }

    const payload: Employee = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      employeeCode,
      fullName: fullName.trim(),
      email: email.trim(),
      department: department.trim() || 'Umum',
      jobTitle: jobTitle.trim() || '-',
      role,
      isActive: editingEmployee ? editingEmployee.isActive : true,
      accountStatus: editingEmployee ? editingEmployee.accountStatus : 'ACTIVE',
      phone,
      bankAccount: {
        bankName,
        accountNumber: accountNumber || '1234567890',
        accountHolder: accountHolder || fullName,
      },
    };

    const res = await SupabaseService.saveEmployee(payload);
    if (res.success) {
      refreshData();
      showToast(
        editingEmployee
          ? `Data karyawan ${fullName} berhasil diperbarui.`
          : `Karyawan baru ${fullName} berhasil ditambahkan.`,
        'success'
      );
      setIsModalOpen(false);
    } else {
      showToast(res.message || 'Gagal menyimpan data.', 'error');
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    const res = await SupabaseService.toggleEmployeeActive(emp.id, emp.isActive);
    if (res.success) {
      refreshData();
      showToast(
        `Status karyawan ${emp.fullName} diubah menjadi ${
          !emp.isActive ? 'Aktif' : 'Nonaktif'
        }.`,
        'info'
      );
    } else {
      showToast(res.message || 'Gagal mengubah status.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Manajemen Data Karyawan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola daftar staf perusahaan, penugasan jabatan, dan informasi rekening payroll.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Department */}
            <div className="w-full sm:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
              >
                <option value="ALL">Semua Departemen</option>
                <option value="People & Operations">People &amp; Operations</option>
                <option value="Engineering & Product">Engineering &amp; Product</option>
                <option value="Finance & Accounting">Finance &amp; Accounting</option>
                <option value="Design & Creative">Design &amp; Creative</option>
                <option value="Marketing & Sales">Marketing &amp; Sales</option>
              </select>
            </div>

            {/* Role */}
            <div className="w-full sm:w-40">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN_HR">Admin / HR</option>
                <option value="MANAGER">Manager</option>
                <option value="FINANCE">Finance</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-hidden focus:border-slate-600"
            />
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-md border border-slate-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Pegawai</th>
                  <th className="px-4 py-2.5 font-bold">Email</th>
                  <th className="px-4 py-2.5 font-bold">Departemen</th>
                  <th className="px-4 py-2.5 font-bold">Jabatan</th>
                  <th className="px-4 py-2.5 font-bold">Hak Akses</th>
                  <th className="px-4 py-2.5 font-bold">Rekening Payroll</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200" suppressHydrationWarning>
                {(mounted ? filteredEmployees : []).map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition" suppressHydrationWarning>
                    <td className="px-4 py-2.5 font-medium text-slate-900" suppressHydrationWarning>
                      <div>{emp.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeCode}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-mono">{emp.email}</td>
                    <td className="px-6 py-3.5 text-slate-700">{emp.department}</td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{emp.jobTitle}</td>
                    <td className="px-6 py-3.5">
                      <RoleBadge role={emp.role} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-mono text-[11px]">
                      {emp.bankAccount
                        ? `${emp.bankAccount.bankName} ${emp.bankAccount.accountNumber}`
                        : '-'}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col gap-1">
                        <AccountStatusBadge status={emp.accountStatus} />
                        {emp.accountStatus === 'ACTIVE' && (
                          <span className="text-[10px] text-slate-400">
                            {emp.isActive ? 'Bisa Login' : 'Dinonaktifkan'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {emp.accountStatus === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await SupabaseService.approveEmployee(emp.id);
                              if (res.success) {
                                showToast(res.message, 'success');
                                refreshData();
                              } else {
                                showToast(res.message, 'error');
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Setujui Akun"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Setujui</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                          title="Edit Karyawan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(emp)}
                          className={`p-1.5 rounded-md transition ${
                            emp.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add / Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
          description="Pastikan data email dan rekening bank sesuai untuk kelancaran absensi dan pencairan klaim."
          maxWidth="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
              >
                Simpan Karyawan
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ID / Kode Karyawan *
                </label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Kantor *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@boyor.agency"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Departemen / Divisi (Opsional)
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Contoh: Kreatif, Lapangan, Sosmed, dsb."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan (Opsional)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Kosongkan jika tidak ada"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Sistem *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FINANCE">Finance</option>
                  <option value="ADMIN_HR">Admin / HR</option>
                </select>
              </div>
            </div>

            {/* Bank details */}
            <div className="pt-3 border-t border-slate-100">
              <span className="font-semibold text-slate-800 block mb-2">
                Informasi Rekening Bank (Tujuan Pencairan)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Nama Bank</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Nomor rekening"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Atas Nama Rekening</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Nama pemilik rekening"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
