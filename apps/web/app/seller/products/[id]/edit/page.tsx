'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { t } = useTranslation();

  const [categories, setCategories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
  const [ingredients, setIngredients] = useState<{ name: string; isAllergen: boolean }[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient<any>(`/products/${id}`),
      apiClient<any[]>('/categories'),
    ])
      .then(([product, cats]) => {
        setCategories(cats || []);
        if (!product) {
          setNotFound(true);
          return;
        }
        setFormData({
          name: product.name || '',
          categoryId: product.categoryId || cats?.[0]?.id || '',
          description: product.description || '',
          price: product.price !== undefined && product.price !== null ? String(product.price) : '',
          preparationTimeHours: product.preparationTimeHours || 4,
          portionSize: product.portionSize || '',
          weightGrams: product.weightGrams ? String(product.weightGrams) : '',
          minimumQuantity: product.minimumQuantity || 1,
          availabilityStatus: product.availabilityStatus || 'AVAILABLE',
        });
        setImageUrls((product.images || []).map((img: any) => img.url));
        setIngredients(
          (product.ingredients || []).map((ing: any) => ({
            name: ing.name,
            isAllergen: Boolean(ing.isAllergen),
          }))
        );
      })
      .catch((err) => {
        console.error(err);
        setNotFound(true);
      })
      .finally(() => setFetching(false));
  }, [id]);

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
    setSuccess(false);

    if (imageUrls.length === 0) {
      setError(t.sellerPages.newProduct.photoRequiredError);
      return;
    }

    setLoading(true);
    try {
      await apiClient(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId,
          description: formData.description,
          price: parseFloat(formData.price),
          preparationTimeHours: parseInt(String(formData.preparationTimeHours), 10),
          portionSize: formData.portionSize || undefined,
          weightGrams: formData.weightGrams ? parseInt(String(formData.weightGrams), 10) : undefined,
          minimumQuantity: parseInt(String(formData.minimumQuantity), 10),
          availabilityStatus: formData.availabilityStatus,
          imageUrls,
          ingredients,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/seller/products');
      }, 900);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const np = t.sellerPages.newProduct;
  const ep = t.sellerPages.editProduct;

  if (fetching) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-2xl w-1/3" />
        <div className="h-64 bg-white rounded-3xl border border-[#EEE6E9]" />
        <div className="h-48 bg-white rounded-3xl border border-[#EEE6E9]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-xl py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#29252A]">{ep.notFound}</h2>
        <Link href="/seller/products">
          <Button variant="primary" className="rounded-xl">{t.common.back}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seller/products">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{ep.title}</h1>
          <p className="text-sm text-[#817781] mt-0.5">{ep.subtitle}</p>
        </div>
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
          <span>{ep.savedToast}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{np.section1}</h3>

          <Input
            label={np.nameLabel}
            name="name"
            placeholder={np.namePlaceholder}
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                {np.categoryLabel}
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
              label={np.priceLabel}
              name="price"
              type="number"
              placeholder={np.pricePlaceholder}
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <Textarea
            label={np.descriptionLabel}
            name="description"
            placeholder={np.descriptionPlaceholder}
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        {/* Specifications & Availability */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{np.section2}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={np.prepHoursLabel}
              name="preparationTimeHours"
              type="number"
              min={1}
              value={formData.preparationTimeHours}
              onChange={handleChange}
              helperText={np.prepHoursHelper}
              required
            />

            <Input
              label={np.portionLabel}
              name="portionSize"
              placeholder={np.portionPlaceholder}
              value={formData.portionSize}
              onChange={handleChange}
            />

            <Input
              label={np.weightLabel}
              name="weightGrams"
              type="number"
              placeholder={np.weightPlaceholder}
              value={formData.weightGrams}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={np.minQtyLabel}
              name="minimumQuantity"
              type="number"
              min={1}
              value={formData.minimumQuantity}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                {np.availabilityLabel}
              </label>
              <select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
              >
                <option value="AVAILABLE">{np.optAvailable}</option>
                <option value="PRE_ORDER_ONLY">{np.optPreOrder}</option>
                <option value="OUT_OF_STOCK">{np.optOutOfStock}</option>
                <option value="UNAVAILABLE">{np.optUnavailable}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ingredients & Allergens */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <h3 className="font-bold text-base text-[#29252A]">{np.section3}</h3>
          <p className="text-xs text-[#817781]">{np.section3Desc}</p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <input
                type="text"
                placeholder={np.ingredientPlaceholder}
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIngredient();
                  }
                }}
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
              {np.allergenCheckbox}
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddIngredient}>
              <Plus className="w-4 h-4 mr-1" /> {np.addIngredientBtn}
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
          <h3 className="font-bold text-base text-[#29252A]">{np.section4}</h3>
          <ImageUploader
            multiple
            value={imageUrls}
            onChange={setImageUrls}
            helperText={np.section4Desc}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/seller/products">
            <Button type="button" variant="outline" size="lg" className="rounded-2xl">
              {np.cancelBtn}
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="rounded-2xl shadow-md">
            <Save className="w-4 h-4 mr-2" /> {ep.saveBtn}
          </Button>
        </div>
      </form>
    </div>
  );
}

