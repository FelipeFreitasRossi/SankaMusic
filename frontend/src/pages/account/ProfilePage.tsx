import { useState, type FormEvent } from 'react';
import { KeyRound, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService, userService } from '../../services/accountService';
import { ApiError, errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import { isValidCpf, maskCpf, maskPhone, onlyDigits, passwordProblem } from '../../utils/format';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { PasswordInput } from '../auth/PasswordInput';
import s from './Account.module.css';

export default function ProfilePage() {
  useDocumentTitle('Meus dados');
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: maskPhone(user?.phone || ''), cpf: maskCpf(user?.cpf || '') });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 3) errs.name = 'Informe seu nome completo.';
    if (form.phone && ![10, 11].includes(onlyDigits(form.phone).length)) errs.phone = 'Telefone inválido.';
    if (form.cpf && !isValidCpf(form.cpf)) errs.cpf = 'CPF inválido.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const u = await userService.updateProfile({
        name: form.name.trim(),
        phone: form.phone ? onlyDigits(form.phone) : undefined,
        cpf: form.cpf ? onlyDigits(form.cpf) : undefined,
      });
      setUser(u);
      toast.success('Dados atualizados.');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(Object.fromEntries(err.errors.map((x) => [x.field, x.message.replace(/^Value error, /, '')])));
      } else toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(pw.next);
    if (!pw.current) return setPwError('Informe a senha atual.');
    if (problem) return setPwError(problem);
    if (pw.next !== pw.confirm) return setPwError('As senhas não conferem.');
    setPwSaving(true);
    setPwError(null);
    try {
      await authService.changePassword(pw.current, pw.next);
      toast.success('Senha alterada com sucesso.');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwError(errorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className={s.stack}>
      <header>
        <h1 className="page-title">Meus dados</h1>
        <p className="muted">Mantenha seus dados atualizados para agilizar suas compras.</p>
      </header>

      <form className={`card ${s.panel}`} onSubmit={save} noValidate>
        <h2>Informações pessoais</h2>
        <div className={s.grid2}>
          <Input label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
          <Input label="E-mail" value={user?.email || ''} disabled hint="Para alterar o e-mail, entre em contato com a loja." />
          <Input label="Celular" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} error={errors.phone} />
          <Input label="CPF" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} error={errors.cpf} hint="Necessário para emissão da nota fiscal." />
        </div>
        <div className={s.actions}>
          <Button type="submit" loading={saving} icon={<Save size={16} />}>
            Salvar alterações
          </Button>
        </div>
      </form>

      <form className={`card ${s.panel}`} onSubmit={changePassword} noValidate>
        <h2>Alterar senha</h2>
        <div className={s.grid3}>
          <PasswordInput label="Senha atual" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <PasswordInput label="Nova senha" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <PasswordInput label="Confirmar nova senha" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        </div>
        {pwError && <Alert>{pwError}</Alert>}
        <div className={s.actions}>
          <Button type="submit" variant="dark" loading={pwSaving} icon={<KeyRound size={16} />}>
            Alterar senha
          </Button>
        </div>
      </form>
    </div>
  );
}
