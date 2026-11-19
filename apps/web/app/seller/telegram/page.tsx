'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function SellerTelegramPage() {
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const [statusData, setStatusData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<{ token: string; botUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient('/telegram/status');
      setStatusData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleGenerateToken = async () => {
    try {
      setGenerating(true);
      const res = await apiClient<{ token: string; botUrl: string }>('/telegram/connect-token', {
        method: 'POST',
      });
      setTokenData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate connection token');
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Telegram notifications?')) return;
    try {
      await apiClient('/telegram/disconnect', { method: 'POST' });
      await fetchStatus();
      await refreshUser();
      setTokenData(null);
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect');
    }
  };

  const p = t.sellerPages.telegram;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      {/* Connection State Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EEE6E9]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center flex-shrink-0">
              <Send className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[#29252A]">Telegram Bot</h3>
                {statusData?.connected ? (
                  <Badge variant="success">{p.connected}</Badge>
                ) : (
                  <Badge variant="warning">{p.notConnected}</Badge>
                )}
              </div>
              <p className="text-xs text-[#817781] mt-0.5">
                {statusData?.connected
                  ? `Chat ID: •••••${statusData.chatId?.slice(-4)}`
                  : p.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusData?.connected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="rounded-xl text-[#DC5151] border-rose-200 hover:bg-rose-50"
              >
                <Unlink className="w-4 h-4 mr-1.5" /> Disconnect
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={generating}
                onClick={handleGenerateToken}
                className="rounded-xl shadow-sm"
              >
                <Send className="w-4 h-4 mr-2" /> {p.connectBtn}
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={fetchStatus} title="Refresh status">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Step-by-step Connection Handshake Instructions */}
        {tokenData && !statusData?.connected && (
          <div className="p-6 rounded-2xl bg-[#FFF8EF] border border-[#fce4ec] space-y-4 animate-in fade-in">
            <h4 className="font-bold text-sm text-[#29252A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D99A52]" />
              {p.step1}
            </h4>
            <p className="text-xs text-[#817781] leading-relaxed">
              {p.step2}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={tokenData.botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="caramel" size="md" className="w-full rounded-xl">
                  {p.connectBtn} <ExternalLink className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
              <Button variant="outline" size="md" onClick={fetchStatus} className="rounded-xl">
                {t.common.actions}
              </Button>
            </div>

            <p className="text-[11px] text-[#817781]">
              Token: <code className="bg-white px-2 py-0.5 rounded font-mono text-[#29252A]">{tokenData.token}</code>
            </p>
          </div>
        )}

        {/* Notification Preview Message */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#817781]">
            Example Telegram Alert Preview
          </h4>
          <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9] font-mono text-xs text-[#29252A] space-y-1.5 max-w-lg">
            <p className="font-bold text-[#E85D8E]">🍬 SWEET CANDY BOT</p>
            <p>Order ID: #SM-2611-4091</p>
            <p>Customer: Ali Valiyev</p>
            <p>Phone: +998 90 123 45 67</p>
            <p className="text-[#817781] pt-1">👉 Tap to Open Seller Dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
