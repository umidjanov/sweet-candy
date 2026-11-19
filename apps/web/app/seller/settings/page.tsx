'use client';

import React, { useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function SellerSettingsPage() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    try {
      setSaving(true);
      await apiClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const p = t.sellerPages.settings;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>✓ {t.common.success}</span>
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#E85D8E]" /> {p.changePassword}
        </h3>

        <Input
          label={p.currentPassword}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          label={p.newPassword}
          type="password"
          placeholder="Min 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Input
          label={p.confirmNewPassword}
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
        />

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="primary" isLoading={saving} className="rounded-xl">
            <Save className="w-4 h-4 mr-1.5" /> {p.updateBtn}
          </Button>
        </div>
      </form>
    </div>
  );
}
