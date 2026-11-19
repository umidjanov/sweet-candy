'use client';

import React, { useState, useEffect } from 'react';
import { Store, CheckCircle2, XCircle, Ban, Eye, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminSellersPage() {
  const { t } = useTranslation();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/admin/sellers?status=${statusFilter}` : '/admin/sellers';
      const res = await apiClient<any>(url);
      setSellers(Array.isArray(res) ? res : res.sellers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const handleUpdateApproval = async (sellerId: string, approvalStatus: string) => {
    if (!confirm(`Are you sure you want to change store status to ${approvalStatus}?`)) return;

    try {
      await apiClient(`/admin/sellers/${sellerId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status: approvalStatus }),
      });
      await fetchSellers();
    } catch (err: any) {
      alert(err.message || 'Failed to update approval status');
    }
  };

  const p = t.adminPages.sellers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {['', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#C83F72] text-white'
                  : 'bg-white border border-[#EEE6E9] text-[#29252A] hover:bg-[#FAF8F6]'
              }`}
            >
              {st === '' ? t.common.all : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-32" />
          ))}
        </div>
      ) : sellers.length > 0 ? (
        <div className="space-y-4">
          {sellers.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft hover:shadow-card transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-[#29252A]">{s.storeName}</h3>
                  <Badge
                    variant={
                      s.approvalStatus === 'APPROVED'
                        ? 'success'
                        : s.approvalStatus === 'PENDING'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {s.approvalStatus}
                  </Badge>
                  <span className="text-xs text-[#817781]">{formatDate(s.createdAt)}</span>
                </div>

                <p className="text-xs text-[#817781] leading-relaxed max-w-2xl">{s.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 text-[#29252A]">
                  <div>
                    <span className="text-[#817781] block">Baker Owner:</span>
                    <span className="font-semibold">{s.user?.firstName} {s.user?.lastName}</span>
                    <span className="text-[#817781] block">{s.user?.phone}</span>
                  </div>

                  <div>
                    <span className="text-[#817781] block">Kitchen Location:</span>
                    <span className="font-semibold">{s.city}, {s.address}</span>
                  </div>

                  <div>
                    <span className="text-[#817781] block">Delivery Service Area:</span>
                    <span className="font-semibold">{s.serviceArea}</span>
                  </div>
                </div>
              </div>

              {/* Approval Actions */}
              <div className="flex items-center gap-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#EEE6E9]">
                {s.approvalStatus !== 'APPROVED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateApproval(s.id, 'APPROVED')}
                    className="rounded-xl bg-[#269B69] hover:bg-emerald-700 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {p.approveBtn}
                  </Button>
                )}

                {s.approvalStatus === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateApproval(s.id, 'REJECTED')}
                    className="rounded-xl text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> {p.rejectBtn}
                  </Button>
                )}

                {s.approvalStatus === 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateApproval(s.id, 'SUSPENDED')}
                    className="rounded-xl text-amber-700 hover:bg-amber-50 border-amber-200"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" /> {p.suspendBtn}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EEE6E9] shadow-soft">
          <p className="text-sm text-[#817781]">{t.common.notFound}</p>
        </div>
      )}
    </div>
  );
}
