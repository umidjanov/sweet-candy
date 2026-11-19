'use client';

import React, { useState, useEffect } from 'react';
import { Store, Clock, Phone, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function SellerStoreSettingsPage() {
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [schedule, setSchedule] = useState([
    { dayOfWeek: 0, isOpen: true, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '21:00' },
  ]);

  useEffect(() => {
    apiClient('/sellers/me/profile')
      .then((data) => {
        setProfile(data);
        if (data?.availabilities?.length > 0) {
          setSchedule(data.availabilities);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleScheduleChange = (dayIdx: number, field: string, val: any) => {
    const updated = [...schedule];
    updated[dayIdx] = { ...updated[dayIdx], [field]: val };
    setSchedule(updated);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all([
        apiClient('/sellers/me/profile', {
          method: 'PUT',
          body: JSON.stringify(profile),
        }),
        apiClient('/sellers/me/availability', {
          method: 'PUT',
          body: JSON.stringify({ schedule }),
        }),
      ]);
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save store profile');
    } finally {
      setSaving(false);
    }
  };

  const p = t.sellerPages.store;

  if (loading) return <div className="p-8 text-sm text-[#817781] animate-pulse">{t.common.loading}</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>✓ {t.common.success}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{p.title}</h3>

          <Input
            label={p.storeName}
            name="storeName"
            value={profile?.storeName || ''}
            onChange={handleProfileChange}
            required
          />

          <Textarea
            label={p.description}
            name="description"
            value={profile?.description || ''}
            onChange={handleProfileChange}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={p.address}
              name="address"
              value={profile?.address || ''}
              onChange={handleProfileChange}
              required
            />
            <Input
              label={p.serviceArea}
              name="serviceArea"
              value={profile?.serviceArea || ''}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className="pt-2">
            <Input
              label={p.publicPhone}
              name="publicPhone"
              type="tel"
              value={profile?.publicPhone || ''}
              onChange={handleProfileChange}
            />
            <label className="flex items-center gap-2 mt-2 text-xs font-semibold text-[#29252A] cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.showPublicPhone ?? true}
                onChange={(e) => setProfile({ ...profile, showPublicPhone: e.target.checked })}
                className="w-4 h-4 rounded text-[#E85D8E] focus:ring-[#E85D8E]"
              />
              {p.publicPhone}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#EEE6E9]">
            <ImageUploader
              multiple={false}
              label={t.imageUpload.storeLogo}
              value={profile?.logoUrl ? [profile.logoUrl] : []}
              onChange={(urls) => setProfile({ ...profile, logoUrl: urls[0] || '' })}
              previewAspect="square"
            />

            <ImageUploader
              multiple={false}
              label={t.imageUpload.storeCover}
              value={profile?.coverImageUrl ? [profile.coverImageUrl] : []}
              onChange={(urls) => setProfile({ ...profile, coverImageUrl: urls[0] || '' })}
              previewAspect="banner"
            />
          </div>
        </div>

        {/* Working Hours Calendar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E85D8E]" /> {p.workingHours}
          </h3>

          <div className="space-y-3 pt-2">
            {schedule.map((item, idx) => (
              <div
                key={item.dayOfWeek}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9]"
              >
                <div className="flex items-center gap-3 w-36">
                  <input
                    type="checkbox"
                    checked={item.isOpen}
                    onChange={(e) => handleScheduleChange(idx, 'isOpen', e.target.checked)}
                    className="w-4 h-4 rounded text-[#E85D8E]"
                  />
                  <span className="font-bold text-xs text-[#29252A]">{days[item.dayOfWeek]}</span>
                </div>

                {item.isOpen ? (
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="time"
                      value={item.openTime}
                      onChange={(e) => handleScheduleChange(idx, 'openTime', e.target.value)}
                      className="px-2 py-1 bg-white border border-[#EEE6E9] rounded-lg text-xs"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={item.closeTime}
                      onChange={(e) => handleScheduleChange(idx, 'closeTime', e.target.value)}
                      className="px-2 py-1 bg-white border border-[#EEE6E9] rounded-lg text-xs"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-rose-600">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={saving} className="rounded-2xl shadow-md">
            <Save className="w-4 h-4 mr-2" /> {p.saveChanges}
          </Button>
        </div>
      </form>
    </div>
  );
}
