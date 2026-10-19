'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { ClaimCategory } from '@/types';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatNumberDot, parseNumberDot, getTodayDateStr } from '@/lib/formatters';
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Save,
  Send,
  AlertCircle,
  Loader2,
  Camera,
} from 'lucide-react';

export default function NewReimbursementPage() {
  const { currentUser, role, refreshData } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Input element refs for auto-focusing on validation error
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (role === 'DIRUT') {
      router.replace('/reimbursements');
    }
  }, [role, router]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ClaimCategory>('Transportasi');
  const [transactionDate, setTransactionDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Set default transaction date to today on mount
  useEffect(() => {
    setTransactionDate(getTodayDateStr());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAttachmentName(file.name);
      setErrors((prev) => ({ ...prev, attachment: '' }));

      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentUrl((event.target?.result as string) || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Judul pengeluaran wajib diisi.';
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus();
    } else if (!transactionDate) {
      newErrors.transactionDate = 'Tanggal transaksi wajib diisi.';
      dateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dateInputRef.current?.focus();
    } else if (!amount || Number(amount) <= 0) {
      newErrors.amount = 'Nominal harus lebih dari 0.';
      amountInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      amountInputRef.current?.focus();
    } else if (!description.trim()) {
      newErrors.description = 'Deskripsi pengeluaran wajib diisi.';
      descInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      descInputRef.current?.focus();
    } else if (!attachmentName) {
      newErrors.attachment = 'Bukti nota/transaksi (Foto/PDF/JPG/PNG) wajib dilampirkan.';
      fileInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTriggerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const isValid = validate();
    if (!isValid) {
      showToast('Harap lengkapi semua field yang berbintang merah.', 'error');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleDraftSubmit = () => {
    if (!title.trim()) {
      setErrors({ title: 'Minimal isi judul pengeluaran untuk menyimpan draft.' });
      titleInputRef.current?.focus();
      return;
    }
    saveData(true);
  };

  const saveData = async (isDraft: boolean) => {
    if (submitting) return;

    if (!currentUser?.id) {
      showToast('Sesi belum siap. Harap tunggu sebentar atau muat ulang halaman.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      let finalAttachmentUrl = attachmentUrl;

      // Jika ada file fisik yang dipilih, upload ke Supabase Storage Bucket 'receipts'
      if (selectedFile) {
        const uploadRes = await SupabaseService.uploadReceipt(selectedFile);
        if (uploadRes.success && uploadRes.url) {
          finalAttachmentUrl = uploadRes.url;
        } else {
          console.warn('File upload notice:', uploadRes.message);
        }
      }

      const res = await SupabaseService.createClaim({
        employeeId: currentUser.id,
        title: title.trim(),
        category,
        transactionDate,
        amount: Number(amount) || 0,
        description: description.trim(),
        attachmentName: attachmentName || undefined,
        attachmentUrl: finalAttachmentUrl || undefined,
        isDraft,
        actor: currentUser,
      });

      if (res.success && res.claim) {
        refreshData();
        showToast(
          isDraft
            ? 'Draft pengajuan klaim berhasil disimpan.'
            : 'Klaim reimbursement berhasil diajukan ke Atasan!',
          'success'
        );
        router.push(`/reimbursements/${res.claim.id}`);
      } else {
        showToast(res.message || 'Gagal menyimpan klaim.', 'error');
      }
    } catch (err: any) {
      console.error('Error saving claim:', err);
      showToast(err?.message || 'Terjadi kesalahan saat menyimpan klaim.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12 sm:pb-6">
        {/* Back Link */}
        <Link
          href="/reimbursements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Reimbursement
        </Link>

        {/* Page Title */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Form Pengajuan Reimbursement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lengkapi rincian biaya operasional yang dikeluarkan untuk kegiatan perusahaan.
          </p>

          <form onSubmit={handleTriggerSubmit} className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="Contoh: Tiket Kereta Dinas Klien Bandung"
                className={`w-full px-3.5 py-2.5 text-sm text-slate-900 border rounded-lg focus:outline-hidden focus:ring-2 ${
                  errors.title
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-indigo-500 bg-white'
                }`}
              />
              {errors.title && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.title}
                </p>
              )}
            </div>

            {/* Grid 2 Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ClaimCategory)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Transportasi">Transportasi</option>
                  <option value="Makan">Makan</option>
                  <option value="Akomodasi">Akomodasi</option>
                  <option value="Perlengkapan Kantor">Perlengkapan Kantor</option>
                  <option value="Komunikasi">Komunikasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Transaksi <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={transactionDate}
                  onChange={(e) => {
                    setTransactionDate(e.target.value);
                    setErrors((prev) => ({ ...prev, transactionDate: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm text-slate-900 border rounded-lg focus:outline-hidden focus:ring-2 ${
                    errors.transactionDate
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-indigo-500 bg-white'
                  }`}
                />
                {errors.transactionDate && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.transactionDate}
                  </p>
                )}
              </div>
            </div>

            {/* Nominal Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal (IDR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-500">
                  Rp
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const parsed = parseNumberDot(rawVal);
                    if (parsed === 0 && rawVal.trim() === '') {
                      setAmount('');
                      setAmountDisplay('');
                    } else {
                      setAmount(parsed);
                      setAmountDisplay(formatNumberDot(rawVal));
                    }
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 font-mono border rounded-lg focus:outline-hidden focus:ring-2 ${
                    errors.amount
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-indigo-500 bg-white'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.amount}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi &amp; Keperluan Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={descInputRef}
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder="Jelaskan rincian agenda, peserta kegiatan, atau urgensi pengeluaran..."
                className={`w-full px-3.5 py-2.5 text-sm text-slate-900 border rounded-lg focus:outline-hidden focus:ring-2 ${
                  errors.description
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-indigo-500 bg-white'
                }`}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.description}
                </p>
              )}
            </div>

            {/* Attachment File Section */}
            <div ref={fileInputRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lampiran Bukti Transaksi (Foto / PDF / JPG / PNG) <span className="text-rose-500">*</span>
              </label>

              {attachmentName ? (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-300 rounded-lg">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate">
                      {attachmentName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentName('');
                      setSelectedFile(null);
                      setAttachmentUrl('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition touch-manipulation cursor-pointer"
                    title="Hapus file terpilih"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 active:bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/60 transition touch-manipulation">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Camera className="w-5 h-5 pointer-events-none" />
                  </div>
                  <span className="text-xs font-medium text-slate-800 text-center">
                    Tap untuk foto nota atau pilih berkas bukti
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 text-center">
                    Format: JPG, PNG, atau PDF
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
              {errors.attachment && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.attachment}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleDraftSubmit}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-lg transition flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 pointer-events-none" />
                <span>Simpan Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSubmit()}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition flex items-center justify-center gap-2 touch-manipulation cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin pointer-events-none" />
                    <span>Memproses Klaim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 pointer-events-none" />
                    <span>Ajukan Klaim</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => saveData(false)}
          title="Konfirmasi Pengajuan Klaim"
          message="Apakah rincian pengeluaran dan berkas bukti transaksi sudah benar? Klaim akan segera diteruskan ke Manager untuk persetujuan."
          confirmText="Ya, Kirim Pengajuan"
          cancelText="Periksa Lagi"
        />
      </div>
    </AppShell>
  );
}
