'use client';

import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiClient<any[]>('/categories');
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await apiClient('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, slug, description, imageUrl }),
      });
      setModalOpen(false);
      setName('');
      setSlug('');
      setDescription('');
      setImageUrl('');
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      await apiClient(`/categories/${id}`, { method: 'DELETE' });
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const p = t.adminPages.categories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        <Button variant="primary" size="md" onClick={() => setModalOpen(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-1.5" /> {p.addNew}
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#29252A]">
          <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
            <tr>
              <th className="px-6 py-4">{p.categoryName}</th>
              <th className="px-6 py-4">{p.categorySlug}</th>
              <th className="px-6 py-4">Subcategories</th>
              <th className="px-6 py-4 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6E9]">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-[#FAF8F6]/50">
                <td className="px-6 py-4 font-bold text-sm text-[#29252A]">{c.name}</td>
                <td className="px-6 py-4 font-mono text-[#817781]">{c.slug}</td>
                <td className="px-6 py-4 text-[#817781]">
                  {c.children?.length > 0 ? c.children.map((sub: any) => sub.name).join(', ') : 'None'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => handleDelete(c.id, c.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={p.addNew}
        description={p.subtitle}
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
          <Input
            label={p.categoryName}
            placeholder="e.g. Birthday Cakes"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            }}
            required
          />
          <Input
            label={p.categorySlug}
            placeholder="e.g. birthday-cakes"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <Input
            label={t.productDetail.description}
            placeholder="..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <ImageUploader
            multiple={false}
            label={t.imageUpload.categoryImage}
            value={imageUrl ? [imageUrl] : []}
            onChange={(urls) => setImageUrl(urls[0] || '')}
            previewAspect="square"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={creating}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
