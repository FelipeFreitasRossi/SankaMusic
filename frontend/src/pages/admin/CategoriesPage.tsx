import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { errorMessage } from '../../services/api';
import { clearCatalogCache } from '../../services/catalogService';
import { useToast } from '../../contexts/ToastContext';
import { useAsync, useDocumentTitle } from '../../hooks';
import type { Category } from '../../types';
import { CategoryIcon, ICON_NAMES } from '../../components/brand/CategoryIcon';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { Alert, ErrorState, Spinner } from '../../components/ui/Feedback';
import { ConfirmDialog, Modal } from '../../components/ui/Overlay';
import s from './Admin.module.css';

type FormState = { name: string; description: string; icon: string; image: string; order: number; active: boolean };
const EMPTY: FormState = { name: '', description: '', icon: 'Guitar', image: '', order: 0, active: true };

export default function CategoriesPage() {
  useDocumentTitle('Categorias');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminService.categories(), []);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const open = (c: Category | 'new') => {
    setEditing(c);
    setFormError(null);
    setForm(
      c === 'new'
        ? { ...EMPTY, order: (data?.length || 0) + 1 }
        : { name: c.name, description: c.description || '', icon: c.icon || 'Guitar', image: c.image || '', order: c.order, active: c.active },
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setFormError('Informe o nome da categoria.');
    if (form.image && !/^https:\/\/|^\//.test(form.image)) return setFormError('URL da imagem inválida.');
    setSaving(true);
    const payload = { ...form, name: form.name.trim(), description: form.description || null, image: form.image || null };
    try {
      if (editing === 'new') await adminService.createCategory(payload);
      else if (editing) await adminService.updateCategory(editing.id, payload);
      clearCatalogCache();
      toast.success('Categoria salva.');
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Category) => {
    try {
      await adminService.updateCategory(c.id, { active: !c.active });
      clearCatalogCache();
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await adminService.deleteCategory(deleting.id);
      clearCatalogCache();
      toast.success('Categoria excluída.');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Categorias</h1>
          <p>Organize a navegação da loja. As alterações aparecem para novos visitantes em instantes.</p>
        </div>
        <Button onClick={() => open('new')} icon={<Plus size={18} />}>
          Nova categoria
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className={s.tableWrap}>
          {data?.map((c) => (
            <div key={c.id} className={s.catRow} style={{ opacity: c.active ? 1 : 0.55 }}>
              <span className={s.catIcon}>
                <CategoryIcon name={c.icon} size={20} />
              </span>
              <div>
                <b>{c.name}</b>
                <small>
                  /{c.slug} · ordem {c.order}
                </small>
              </div>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                {c.product_count} produtos
              </span>
              <button className={`${s.switch} ${c.active ? s.switchOn : ''}`} role="switch" aria-checked={c.active} aria-label={c.active ? 'Desativar' : 'Ativar'} onClick={() => toggle(c)} />
              <div className={s.rowActions}>
                <button className={s.iconAction} onClick={() => open(c)} aria-label="Editar">
                  <Pencil size={16} />
                </button>
                <button className={`${s.iconAction} ${s.iconDanger}`} onClick={() => setDeleting(c)} aria-label="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!data?.length && <p className={s.empty}>Nenhuma categoria cadastrada.</p>}
        </div>
      )}

      <Modal open={!!editing} title={editing === 'new' ? 'Nova categoria' : 'Editar categoria'} onClose={() => setEditing(null)}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} />
          <Textarea label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={400} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <Select label="Ícone" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              {ICON_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Input label="Ordem" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value || '0', 10) })} />
          </div>
          <Input label="Imagem (URL, opcional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." hint="Usada nos cards de categoria da página inicial." />
          {formError && <Alert>{formError}</Alert>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir categoria"
        message={`Excluir "${deleting?.name}"? Só é possível excluir categorias sem produtos.`}
        confirmLabel="Excluir"
        danger
        loading={saving}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
