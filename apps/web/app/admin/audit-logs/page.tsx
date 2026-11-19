'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any>('/admin/audit-logs?limit=50')
      .then((res) => setLogs(Array.isArray(res) ? res : res.logs || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const p = t.adminPages.auditLogs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-20" />
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#29252A]">
            <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
              <tr>
                <th className="px-6 py-4">{t.common.actions}</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">IP</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6E9]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF8F6]/50">
                  <td className="px-6 py-4 font-mono font-bold text-[#C83F72]">{log.action}</td>
                  <td className="px-6 py-4 font-medium">
                    {log.entity} <span className="text-[#817781]">({log.entityId})</span>
                  </td>
                  <td className="px-6 py-4 text-[#817781]">
                    {log.user ? `${log.user.firstName} (${log.user.email || log.user.role})` : 'System Bootstrap'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#817781]">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="px-6 py-4 text-right text-[#817781]">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EEE6E9] shadow-soft">
          <p className="text-sm text-[#817781]">{t.common.notFound}</p>
        </div>
      )}
    </div>
  );
}
