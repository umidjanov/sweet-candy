'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Ban,
  CheckCircle2,
  Shield,
  KeyRound,
  Copy,
  Check,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

function generateTempPassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Sweet${digits}!`;
}

export default function AdminUsersPage() {
  const { t, lang } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Track newly set temporary passwords in this admin session so admin can copy/share immediately
  const [issuedPasswords, setIssuedPasswords] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Password reset modal state
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccessUser, setResetSuccessUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiClient<any>(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(res) ? res : res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1600);
    } catch {
      // Clipboard fallback not needed in modern Chrome
    }
  };

  const openResetModal = (u: any) => {
    setResetTarget(u);
    setTempPassword(generateTempPassword());
    setResetError('');
    setResetSuccessUser(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    const cleanPassword = tempPassword.trim();
    if (cleanPassword.length < 6) {
      setResetError(
        lang === 'ru'
          ? 'Пароль должен содержать минимум 6 символов'
          : lang === 'en'
            ? 'Password must be at least 6 characters'
            : "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
      );
      return;
    }

    setResetting(true);
    setResetError('');
    try {
      await apiClient(`/admin/users/${resetTarget.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: cleanPassword }),
      });
      setIssuedPasswords((prev) => ({ ...prev, [resetTarget.id]: cleanPassword }));
      setResetSuccessUser({ ...resetTarget, newPassword: cleanPassword });
      await fetchUsers();
    } catch (err: any) {
      setResetError(err.message || 'Failed to set temporary password');
    } finally {
      setResetting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to mark this user as ${nextStatus}?`)) return;

    try {
      await apiClient(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const p = t.adminPages.users;
  const copy = {
    uz: {
      totalBadge: (n: number) => `Jami: ${n} ta`,
      infoTitle: "Foydalanuvchilar loginlari va parollari haqida",
      infoDesc:
        "Oldin ro'yxatdan o'tgan barcha foydalanuvchilarning telefon/email loginlari shu jadvalda ko'rinadi. Xavfsizlik uchun barcha parollar bir tomonlama bcrypt bilan shifrlangan (asl parolni ochib bo'lmaydi), ammo istalgan foydalanuvchiga \"Yangi parol\" tugmasi orqali vaqtinchalik parol berib, darhol nusxalab berishingiz mumkin.",
      loginCol: 'Login (Tel / Email)',
      passwordCol: 'Parol',
      encryptedNote: 'Bcrypt shifrlangan',
      tempActiveBadge: 'Vaqtinchalik parol',
      copyCreds: 'Login+Parol',
      newPassBtn: 'Yangi parol',
      modalTitle: 'Yangi vaqtinchalik parol berish',
      modalDesc: (name: string) => `${name} akkaunti uchun yangi kirish parolini o'rnating.`,
      newPassLabel: 'Yangi parol (kamida 6 belgi)',
      autoBtn: 'Avto',
      submitBtn: "Parolni o'rnatish",
      cancelBtn: 'Bekor qilish',
      doneTitle: "Vaqtinchalik parol o'rnatildi!",
      copyAllBtn: 'Login va parolni nusxalash',
      copiedText: 'Nusxalandi!',
      closeBtn: 'Yopish',
    },
    ru: {
      totalBadge: (n: number) => `Всего: ${n}`,
      infoTitle: 'О логинах и паролях пользователей',
      infoDesc:
        'Все ранее зарегистрированные пользователи отображаются здесь с телефонами и email. В целях безопасности пароли хранятся в одностороннем bcrypt-хэше (исходный пароль просмотреть невозможно), но для любого пользователя можно назначить временный пароль кнопкой «Новый пароль».',
      loginCol: 'Логин (Тел / Email)',
      passwordCol: 'Пароль',
      encryptedNote: 'Bcrypt зашифрован',
      tempActiveBadge: 'Временный пароль',
      copyCreds: 'Логин+Пароль',
      newPassBtn: 'Новый пароль',
      modalTitle: 'Назначить новый временный пароль',
      modalDesc: (name: string) => `Установите новый пароль для аккаунта ${name}.`,
      newPassLabel: 'Новый пароль (минимум 6 символов)',
      autoBtn: 'Авто',
      submitBtn: 'Установить пароль',
      cancelBtn: 'Отмена',
      doneTitle: 'Временный пароль установлен!',
      copyAllBtn: 'Скопировать логин и пароль',
      copiedText: 'Скопировано!',
      closeBtn: 'Закрыть',
    },
    en: {
      totalBadge: (n: number) => `Total: ${n}`,
      infoTitle: 'About user logins and passwords',
      infoDesc:
        'All previously registered users and their phone/email logins appear here. For security, passwords are stored as one-way bcrypt hashes and cannot be decrypted, but you can click "New password" on any account to set and copy a temporary password.',
      loginCol: 'Login (Phone / Email)',
      passwordCol: 'Password',
      encryptedNote: 'Bcrypt hashed',
      tempActiveBadge: 'Temp password set',
      copyCreds: 'Login+Pass',
      newPassBtn: 'New password',
      modalTitle: 'Assign Temporary Password',
      modalDesc: (name: string) => `Set a new login password for ${name}.`,
      newPassLabel: 'New password (min 6 chars)',
      autoBtn: 'Auto',
      submitBtn: 'Set password',
      cancelBtn: 'Cancel',
      doneTitle: 'Temporary password saved!',
      copyAllBtn: 'Copy login & password',
      copiedText: 'Copied!',
      closeBtn: 'Close',
    },
  }[lang];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
            {!loading && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF0F5] text-[#E85D8E] border border-[#F5D6DF]">
                {copy.totalBadge(users.length)}
              </span>
            )}
          </div>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder={p.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="px-4 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          >
            <option value="">{p.allRoles}</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          >
            <option value="">{t.common.status}</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Security & Password Info Banner */}
      <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#E85D8E] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <p className="font-bold text-[#29252A]">{copy.infoTitle}</p>
          <p className="text-[#817781] leading-relaxed">{copy.infoDesc}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-20" />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#29252A]">
              <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
                <tr>
                  <th className="px-5 py-4">{t.dashboard.admin.usersCount}</th>
                  <th className="px-5 py-4">{copy.loginCol}</th>
                  <th className="px-5 py-4">{copy.passwordCol}</th>
                  <th className="px-5 py-4">{t.common.role}</th>
                  <th className="px-5 py-4">{t.common.status}</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6E9]">
                {users.map((u) => {
                  const issuedPass = issuedPasswords[u.id];
                  const canResetPassword = u.role !== 'ADMIN' || u.id === currentUser?.id;
                  const credsText = `Login: ${u.email || u.phone}\nTelefon: ${u.phone}${u.email ? `\nEmail: ${u.email}` : ''}\nParol: ${issuedPass || ''}`;

                  return (
                    <tr key={u.id} className="hover:bg-[#FAF8F6]/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-sm block">
                          {u.firstName} {u.lastName}
                        </span>
                        {u.sellerProfile && (
                          <span className="text-[11px] text-[#D99A52] font-semibold">
                            Store: {u.sellerProfile.storeName}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span>{u.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`phone-${u.id}`, u.phone)}
                            className="p-1 rounded-md hover:bg-[#FFF0F5] text-[#817781] hover:text-[#E85D8E] transition-colors"
                            title="Copy phone"
                          >
                            {copiedKey === `phone-${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-[#817781] text-[11px]">
                            <span>{u.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`email-${u.id}`, u.email)}
                              className="p-1 rounded-md hover:bg-[#FFF0F5] text-[#817781] hover:text-[#E85D8E] transition-colors"
                              title="Copy email"
                            >
                              {copiedKey === `email-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {issuedPass ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs">
                              {issuedPass}
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleCopy(`creds-${u.id}`, credsText)}
                                className="text-[11px] font-semibold text-[#E85D8E] hover:underline inline-flex items-center gap-1"
                              >
                                {copiedKey === `creds-${u.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">{copy.copiedText}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{copy.copyCreds}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F6] border border-[#EEE6E9] text-[#817781] font-medium">
                              <Lock className="w-3 h-3" />
                              {copy.encryptedNote}
                            </span>
                            {u.mustChangePassword && (
                              <div>
                                <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  {copy.tempActiveBadge}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={u.role === 'ADMIN' ? 'danger' : u.role === 'SELLER' ? 'warning' : 'outline'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {u.status === 'ACTIVE' ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Suspended</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#817781]">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {canResetPassword && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResetModal(u)}
                              className="rounded-xl text-xs border-[#EEE6E9] hover:border-[#E85D8E] hover:text-[#E85D8E]"
                            >
                              <KeyRound className="w-3.5 h-3.5 mr-1" /> {copy.newPassBtn}
                            </Button>
                          )}
                          {u.role !== 'ADMIN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`rounded-xl text-xs ${
                                u.status === 'ACTIVE'
                                  ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                                  : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? (
                                <>
                                  <Ban className="w-3.5 h-3.5 mr-1" /> {t.dashboard.admin.suspend}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.dashboard.admin.approve}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EEE6E9] shadow-soft">
          <p className="text-sm text-[#817781]">{t.common.notFound}</p>
        </div>
      )}

      {/* Assign Temporary Password Modal */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={copy.modalTitle}
        description={resetTarget ? copy.modalDesc(`${resetTarget.firstName} ${resetTarget.lastName}`) : ''}
      >
        {resetTarget && resetSuccessUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <p className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4" /> {copy.doneTitle}
              </p>
              <div className="font-mono text-[#29252A] space-y-1 bg-white p-3 rounded-xl border border-emerald-100">
                <div>Telefon: {resetSuccessUser.phone}</div>
                {resetSuccessUser.email && <div>Email: {resetSuccessUser.email}</div>}
                <div>
                  Parol: <span className="font-black text-emerald-700">{resetSuccessUser.newPassword}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={() =>
                  handleCopy(
                    `modal-creds-${resetSuccessUser.id}`,
                    `Login: ${resetSuccessUser.email || resetSuccessUser.phone}\nTelefon: ${resetSuccessUser.phone}${resetSuccessUser.email ? `\nEmail: ${resetSuccessUser.email}` : ''}\nParol: ${resetSuccessUser.newPassword}`
                  )
                }
                className="rounded-xl"
              >
                {copiedKey === `modal-creds-${resetSuccessUser.id}` ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" /> {copy.copiedText}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" /> {copy.copyAllBtn}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)} className="rounded-xl">
                {copy.closeBtn}
              </Button>
            </div>
          </div>
        ) : resetTarget ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#FAF8F6] border border-[#EEE6E9] text-xs font-mono text-[#29252A] space-y-0.5">
              <div>Telefon: {resetTarget.phone}</div>
              {resetTarget.email && <div>Email: {resetTarget.email}</div>}
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={copy.newPassLabel}
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  error={resetError || undefined}
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTempPassword(generateTempPassword())}
                className="rounded-xl h-[42px] px-3"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#D99A52]" /> {copy.autoBtn}
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)} className="rounded-xl">
                {copy.cancelBtn}
              </Button>
              <Button type="submit" variant="primary" isLoading={resetting} className="rounded-xl">
                {copy.submitBtn}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

