'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ShoppingBag, Store, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient<any>('/notifications');
      setNotifications(res?.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'PATCH' });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{t.nav.incomingOrders}</h1>
          <p className="text-sm text-[#817781] mt-1">{t.account.ordersSubtitle}</p>
        </div>

        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="rounded-xl text-xs">
            <CheckCheck className="w-4 h-4 mr-1.5" /> {t.common.actions}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-20" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft divide-y divide-[#EEE6E9]">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-6 flex items-start justify-between gap-4 transition-colors ${
                notif.isRead ? 'bg-white' : 'bg-[#FFF0F5]/30'
              }`}
            >
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#29252A]">{notif.title}</h4>
                <p className="text-xs text-[#817781] leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-[#817781] block pt-1">{formatDate(notif.createdAt)}</span>
              </div>

              {notif.linkUrl && (
                <Link href={notif.linkUrl}>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs whitespace-nowrap">
                    {t.common.viewAll}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.common.notFound}
          description={t.account.ordersSubtitle}
        />
      )}
    </div>
  );
}
