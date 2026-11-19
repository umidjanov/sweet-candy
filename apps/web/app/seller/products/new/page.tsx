'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cake, ArrowLeft, Plus, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AddProductPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    preparationTimeHours: 4,
    portionSize: '',
    weightGrams: '',
    minimumQuantity: 1,
    availabilityStatus: 'AVAILABLE',
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [ingredientName, setIngredientName] = useState('');
  const [isAllergen, setIsAllergen] = useState(false);
  const [ingredients, setIngredients] = useState<{ name: string; isAllergen: boolean }[]>([
    { name: 'Flour', isAllergen: true },
    { name: 'Belgian Chocolate', isAllergen: false },
    { name: 'Dairy Butter', isAllergen: true },
    { name: 'Eggs', isAllergen: true },
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient('/categories')
      .then((data) => {
        setCategories(data || []);
        if (data?.[0]?.id) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddIngredient = () => {
    if (ingredientName.trim()) {
      setIngredients([...ingredients, { name: ingredientName.trim(), isAllergen }]);
      setIngredientName('');
      setIsAllergen(false);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (imageUrls.length === 0) {
      setError(t.sellerPages.newProduct.photoRequiredError);
      return;
    }

    setLoading(true);
    try {
      await apiClient('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          preparationTimeHours: parseInt(formData.preparationTimeHours as any, 10),
          weightGrams: formData.weightGrams ? parseInt(formData.weightGrams as any, 10) : undefined,
          minimumQuantity: parseInt(formData.minimumQuantity as any, 10),
          imageUrls,
          ingredients,
        }),
      });

      router.push('/seller/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create dessert listing');
    } finally {
      setLoading(false);
    }
  };

  const p = t.sellerPages.newProduct;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seller/products">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-0.5">{p.subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{p.section1}</h3>

          <Input
            label={p.nameLabel}
            name="name"
            placeholder={p.namePlaceholder}
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                {p.categoryLabel}
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={p.priceLabel}
              name="price"
              type="number"
              placeholder={p.pricePlaceholder}
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <Textarea
            label={p.descriptionLabel}
            name="description"
            placeholder={p.descriptionPlaceholder}
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{p.section2}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={p.prepHoursLabel}
              name="preparationTimeHours"
              type="number"
              min={1}
              value={formData.preparationTimeHours}
              onChange={handleChange}
              helperText={p.prepHoursHelper}
              required
            />

            <Input
              label={p.portionLabel}
              name="portionSize"
              placeholder={p.portionPlaceholder}
              value={formData.portionSize}
              onChange={handleChange}
            />

            <Input
              label={p.weightLabel}
              name="weightGrams"
              type="number"
              placeholder={p.weightPlaceholder}
              value={formData.weightGrams}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={p.minQtyLabel}
              name="minimumQuantity"
              type="number"
              min={1}
              value={formData.minimumQuantity}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                {p.availabilityLabel}
              </label>
              <select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
              >
                <option value="AVAILABLE">{p.optAvailable}</option>
                <option value="UNAVAILABLE">{p.optUnavailable}</option>
                <option value="OUT_OF_STOCK">{p.optOutOfStock}</option>
                <option value="PRE_ORDER_ONLY">{p.optPreOrder}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ingredients & Allergens */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{p.section3}</h3>
          <p className="text-xs text-[#817781]">{p.section3Desc}</p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <input
                type="text"
                placeholder={p.ingredientPlaceholder}
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#29252A] whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={isAllergen}
                onChange={(e) => setIsAllergen(e.target.checked)}
                className="w-4 h-4 rounded text-[#E85D8E] focus:ring-[#E85D8E]"
              />
              {p.allergenCheckbox}
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddIngredient}>
              <Plus className="w-4 h-4 mr-1" /> {p.addIngredientBtn}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {ingredients.map((ing, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium border ${
                  ing.isAllergen
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                    : 'bg-[#FAF8F6] text-[#29252A] border-[#EEE6E9]'
                }`}
              >
                <span>{ing.name} {ing.isAllergen && '⚠️ (Allergen)'}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(i)}
                  className="text-[#817781] hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{p.section4}</h3>
          <ImageUploader
            multiple
            value={imageUrls}
            onChange={setImageUrls}
            helperText={p.section4Desc}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/seller/products">
            <Button variant="outline" size="lg" className="rounded-2xl">
              {p.cancelBtn}
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="rounded-2xl shadow-md">
            {p.publishBtn}
          </Button>
        </div>
      </form>
    </div>
  );
}
