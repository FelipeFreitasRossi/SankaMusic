import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, ImagePlus, Link2, Plus, Save, Trash2, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ApiError, errorMessage } from '../../services/api';
import { catalogService, clearCatalogCache } from '../../services/catalogService';
import { useToast } from '../../contexts/ToastContext';
import { useDocumentTitle } from '../../hooks';
import type { Category, ProductInput, Spec } from '../../types';
import { imgUrl } from '../../utils/constants';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert, Spinner } from '../../components/ui/Feedback';
import s from './Admin.module.css';

const EMPTY: ProductInput = {
  name: '',
  slug: '',
  sku: '',
  brand: '',
  category_id: '',
  price: 0,
  promo_price: null,
  stock: 0,
  description: '',
  specs: [],
  images: [],
  featured: false,
  active: true,
};

const MAX_MB = 5;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  useDocumentTitle(isNew ? 'Novo produto' : 'Editar produto');
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [priceText, setPriceText] = useState({ price: '', promo: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.categories().then(setCategories).catch(() => undefined);
    catalogService.showcase().then((d) => setBrands(d.brands)).catch(() => undefined);
    if (!id) return;
    adminService
      .product(id)
      .then((p) => {
        setForm({
          name: p.name,
          slug: p.slug,
          sku: p.sku || '',
          brand: p.brand,
          category_id: p.category_id,
          price: p.price,
          promo_price: p.promo_price ?? null,
          stock: p.stock,
          description: p.description,
          specs: p.specs,
          images: p.images,
          featured: p.featured,
          active: p.active,
        });
        const br = (n: number) => n.toFixed(2).replace('.', ',');
        setPriceText({ price: br(p.price), promo: p.promo_price ? br(p.promo_price) : '' });
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  // Aceita "1.234,56" (BR) ou "1234.56"
  const parseMoney = (v: string) => Number(v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v) || 0;

  // --------------------------------------------------------------- specs
  const setSpec = (i: number, k: keyof Spec, v: string) => set('specs', form.specs.map((sp, j) => (j === i ? { ...sp, [k]: v } : sp)));
  const addSpec = () => set('specs', [...form.specs, { label: '', value: '' }]);
  const removeSpec = (i: number) => set('specs', form.specs.filter((_, j) => j !== i));

  // --------------------------------------------------------------- imagens
  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (form.images.length + files.length > 12) return toast.error('Máximo de 12 imagens por produto.');
    setUploading(true);
    const uploaded: string[] = [];
    for (const f of files) {
      if (!ACCEPT.includes(f.type)) {
        toast.error(`${f.name}: formato não permitido (use JPG, PNG ou WEBP).`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name}: maior que ${MAX_MB} MB.`);
        continue;
      }
      try {
        uploaded.push((await adminService.uploadImage(f)).url);
      } catch (err) {
        toast.error(`${f.name}: ${errorMessage(err)}`);
      }
    }
    setForm((cur) => ({ ...cur, images: [...cur.images, ...uploaded] }));
    setUploading(false);
    if (uploaded.length) toast.success(`${uploaded.length} imagem(ns) enviada(s).`);
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!/^https:\/\/|^\//.test(url)) return toast.error('Informe uma URL https:// válida.');
    set('images', [...form.images, url]);
    setImageUrl('');
  };
  const removeImage = (i: number) => set('images', form.images.filter((_, j) => j !== i));
  const makeCover = (i: number) => set('images', [form.images[i], ...form.images.filter((_, j) => j !== i)]);

  // --------------------------------------------------------------- salvar
  const validate = () => {
    const e: Record<string, string> = {};
    const price = parseMoney(priceText.price);
    const promo = priceText.promo ? parseMoney(priceText.promo) : null;
    if (form.name.trim().length < 3) e.name = 'Informe o nome do produto.';
    if (!form.brand.trim()) e.brand = 'Informe a marca.';
    if (!form.category_id) e.category_id = 'Selecione a categoria.';
    if (!(price > 0)) e.price = 'Informe um preço válido.';
    if (promo !== null && (promo <= 0 || promo >= price)) e.promo_price = 'O preço promocional deve ser menor que o preço.';
    if (!Number.isInteger(form.stock) || form.stock < 0) e.stock = 'Estoque inválido.';
    if (form.specs.some((sp) => !sp.label.trim() || !sp.value.trim())) e.specs = 'Preencha ou remova as especificações vazias.';
    return { e, price, promo };
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const { e, price, promo } = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setError('Corrija os campos destacados.');
      return;
    }
    setError(null);
    setSaving(true);
    const payload: ProductInput = {
      ...form,
      name: form.name.trim(),
      brand: form.brand.trim(),
      sku: form.sku?.trim() || null,
      slug: form.slug?.trim() || undefined,
      price,
      promo_price: promo,
    };
    try {
      if (isNew) {
        const created = await adminService.createProduct(payload);
        toast.success('Produto cadastrado.');
        navigate(`/admin/produtos/${created.id}`, { replace: true });
      } else {
        const changes: Partial<ProductInput> = { ...payload, promo_price: promo ?? 0 };
        delete changes.slug;
        await adminService.updateProduct(id!, changes);
        toast.success('Alterações salvas.');
      }
      clearCatalogCache();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(Object.fromEntries(err.errors.map((x) => [x.field, x.message])));
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <form onSubmit={submit} noValidate>
      <div className={s.pageHead}>
        <div>
          <Link to="/admin/produtos" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Produtos
          </Link>
          <h1>{isNew ? 'Novo produto' : form.name || 'Editar produto'}</h1>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{error}</Alert>
        </div>
      )}

      <div className={s.formGrid}>
        <div className={s.formCol}>
          <section className={s.panel}>
            <h2>Informações básicas</h2>
            <div className={s.fields}>
              <Input className={s.full} label="Nome do produto" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} required maxLength={160} />
              <Input label="Marca" list="brand-list" value={form.brand} onChange={(e) => set('brand', e.target.value)} error={errors.brand} required maxLength={60} />
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <Select label="Categoria" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} error={errors.category_id} required>
                <option value="">Selecione</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.active && ' (inativa)'}
                  </option>
                ))}
              </Select>
              <Input label="SKU / Código" value={form.sku || ''} onChange={(e) => set('sku', e.target.value)} maxLength={60} />
              <Input
                label="Slug (URL)"
                value={form.slug || ''}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                disabled={!isNew}
                hint={isNew ? 'Gerado automaticamente se vazio.' : 'Não pode ser alterado (preserva links).'}
              />
              <Textarea className={s.full} label="Descrição" value={form.description} onChange={(e) => set('description', e.target.value)} rows={7} maxLength={8000} />
            </div>
          </section>

          <section className={s.panel}>
            <h2>Especificações técnicas</h2>
            {form.specs.map((sp, i) => (
              <div key={i} className={s.specRow}>
                <Input placeholder="Característica (ex.: Corpo)" value={sp.label} onChange={(e) => setSpec(i, 'label', e.target.value)} aria-label="Característica" maxLength={60} />
                <Input placeholder="Valor (ex.: Basswood)" value={sp.value} onChange={(e) => setSpec(i, 'value', e.target.value)} aria-label="Valor" maxLength={200} />
                <button type="button" className={`${s.iconAction} ${s.iconDanger}`} style={{ height: 46, width: 46 }} onClick={() => removeSpec(i)} aria-label="Remover especificação">
                  <X size={16} />
                </button>
              </div>
            ))}
            {errors.specs && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{errors.specs}</p>}
            <Button type="button" variant="outline" size="sm" onClick={addSpec} icon={<Plus size={16} />}>
              Adicionar especificação
            </Button>
          </section>

          <section className={s.panel}>
            <h2>Imagens</h2>
            <div className={s.images}>
              {form.images.map((src, i) => (
                <div key={src + i} className={s.imageTile}>
                  <img src={imgUrl(src)} alt={`Imagem ${i + 1}`} />
                  {i === 0 && <span className={s.coverTag}>CAPA</span>}
                  <div className={s.imgActions}>
                    {i > 0 && (
                      <button type="button" onClick={() => makeCover(i)} aria-label="Definir como capa" title="Definir como capa">
                        <ArrowLeftRight size={14} />
                      </button>
                    )}
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remover imagem" title="Remover">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {form.images.length < 12 && (
                <button type="button" className={s.upload} onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Spinner label="" /> : <ImagePlus size={26} />}
                  {uploading ? 'Enviando…' : 'Enviar imagens'}
                  <small style={{ fontWeight: 400 }}>JPG, PNG ou WEBP até {MAX_MB} MB</small>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept={ACCEPT.join(',')} multiple hidden onChange={onFiles} />
            <div className={s.urlRow}>
              <Input placeholder="https://cdn.exemplo.com/imagem.webp" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} aria-label="URL da imagem" />
              <Button type="button" variant="outline" onClick={addImageUrl} icon={<Link2 size={16} />}>
                Adicionar URL
              </Button>
            </div>
          </section>
        </div>

        <div className={s.formCol}>
          <section className={s.panel}>
            <h2>Preço e estoque</h2>
            <div className={s.fields}>
              <Input
                className={s.full}
                label="Preço (R$)"
                inputMode="decimal"
                value={priceText.price}
                onChange={(e) => setPriceText((p) => ({ ...p, price: e.target.value.replace(/[^\d.,]/g, '') }))}
                error={errors.price}
                required
                placeholder="0,00"
              />
              <Input
                className={s.full}
                label="Preço promocional (R$)"
                inputMode="decimal"
                value={priceText.promo}
                onChange={(e) => setPriceText((p) => ({ ...p, promo: e.target.value.replace(/[^\d.,]/g, '') }))}
                error={errors.promo_price}
                hint="Deixe vazio para remover a promoção."
                placeholder="0,00"
              />
              <Input className={s.full} label="Estoque (unidades)" type="number" min={0} value={form.stock} onChange={(e) => set('stock', Math.max(0, parseInt(e.target.value || '0', 10)))} error={errors.stock} required />
            </div>
          </section>

          <section className={s.panel}>
            <h2>Visibilidade</h2>
            <div className={s.toggles}>
              <div className={s.toggleRow}>
                <span>
                  <b>Produto ativo</b>
                  <small>Inativos não aparecem na loja.</small>
                </span>
                <button type="button" role="switch" aria-checked={form.active} className={`${s.switch} ${form.active ? s.switchOn : ''}`} onClick={() => set('active', !form.active)} aria-label="Produto ativo" />
              </div>
              <div className={s.toggleRow}>
                <span>
                  <b>Destaque na página inicial</b>
                  <small>Exibido em “Produtos em destaque”.</small>
                </span>
                <button type="button" role="switch" aria-checked={form.featured} className={`${s.switch} ${form.featured ? s.switchOn : ''}`} onClick={() => set('featured', !form.featured)} aria-label="Destaque" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className={s.stickyBar}>
        <Button type="button" variant="outline" to="/admin/produtos">
          Cancelar
        </Button>
        <Button type="submit" loading={saving} icon={<Save size={18} />}>
          {isNew ? 'Cadastrar produto' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}
