'use client';

import React, { useState } from 'react';
import { User, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function CustomerProfilePage() {
  const { user } = useAuth();
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
      setError('New passwords do not match');
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{t.account.profileTitle}</h1>
        <p className="text-sm text-[#817781] mt-1">{t.account.profileSubtitle}</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
          <User className="w-4 h-4 text-[#E85D8E]" /> Personal Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#817781] block">Full Name:</span>
            <span className="font-bold text-sm text-[#29252A]">{user?.firstName} {user?.lastName}</span>
          </div>
          <div>
            <span className="text-[#817781] block">Phone Number:</span>
            <span className="font-bold text-sm text-[#29252A]">{user?.phone}</span>
          </div>
          {user?.email && (
            <div>
              <span className="text-[#817781] block">Email:</span>
              <span className="font-bold text-sm text-[#29252A]">{user?.email}</span>
            </div>
          )}
          <div>
            <span className="text-[#817781] block">Account Role:</span>
            <span className="font-bold text-sm text-[#E85D8E]">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#E85D8E]" /> Update Password
        </h3>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>✓ Password updated successfully!</span>
          </div>
        )}

        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
        />

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="primary" isLoading={saving} className="rounded-xl">
            <Save className="w-4 h-4 mr-1.5" /> Save New Password
          </Button>
        </div>
      </form>
    </div>
  );
}
