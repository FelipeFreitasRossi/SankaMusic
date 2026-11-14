import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ApiError, errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import { isValidEmail, maskPhone, onlyDigits, passwordProblem } from '../../utils/format';
import { Checkbox, Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { AuthShell } from './AuthShell';
import { PasswordInput } from './PasswordInput';
import { safeNext } from './LoginPage';
import s from './Auth.module.css';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'confirm' | 'terms', string>>;

export default function RegisterPage() {
  useDocumentTitle('Criar conta');
  const { register, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.name.trim().length < 3) e.name = 'Informe seu nome completo.';
    if (!isValidEmail(form.email)) e.email = 'E-mail inválido.';
    if (form.phone && ![10, 11].includes(onlyDigits(form.phone).length)) e.phone = 'Telefone inválido.';
    const pw = passwordProblem(form.password);
    if (pw) e.password = pw;
    if (form.confirm !== form.password) e.confirm = 'As senhas não conferem.';
    if (!terms) e.terms = 'É necessário aceitar os termos.';
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setError(null);
    try {
      const u = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone || undefined });
      toast.success(`Conta criada! Bem-vindo(a), ${u.name.split(' ')[0]}.`);
    } catch (err) {
      if (err instanceof ApiError && err.errors?.length) {
        const fe: Errors = {};
        err.errors.forEach((x) => (fe[x.field as keyof Errors] = x.message.replace(/^Value error, /, '')));
        setErrors(fe);
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle={
        <>
          Já tem cadastro? <Link to={`/entrar?next=${encodeURIComponent(next)}`}>Entrar</Link>
        </>
      }
    >
      <form className={s.form} onSubmit={submit} noValidate>
        <Input label="Nome completo" autoComplete="name" value={form.name} onChange={(e) => set('name')(e.target.value)} error={errors.name} required />
        <Input label="E-mail" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} error={errors.email} required />
        <Input
          label="Celular (opcional)"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set('phone')(maskPhone(e.target.value))}
          error={errors.phone}
          placeholder="(00) 00000-0000"
        />
        <PasswordInput
          label="Senha"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set('password')(e.target.value)}
          error={errors.password}
          hint="Mínimo de 8 caracteres, com letras e números."
          required
        />
        <PasswordInput label="Confirme a senha" autoComplete="new-password" value={form.confirm} onChange={(e) => set('confirm')(e.target.value)} error={errors.confirm} required />
        <div>
          <Checkbox
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            label={
              <>
                Li e aceito os <Link to="/info/termos" target="_blank">termos de uso</Link> e a{' '}
                <Link to="/info/politica-de-privacidade" target="_blank">política de privacidade</Link>.
              </>
            }
          />
          {errors.terms && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.terms}</p>}
        </div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" block loading={loading} icon={<UserPlus size={18} />}>
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
