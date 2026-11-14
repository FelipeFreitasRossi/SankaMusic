import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import { isValidEmail } from '../../utils/format';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { AuthShell } from './AuthShell';
import { PasswordInput } from './PasswordInput';
import s from './Auth.module.css';

/** Redireciona apenas para caminhos internos (evita open redirect). */
export function safeNext(next: string | null, fallback = '/conta') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

export default function LoginPage() {
  useDocumentTitle('Entrar');
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.');
    if (!password) return setError('Informe sua senha.');
    setError(null);
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Bem-vindo(a), ${u.name.split(' ')[0]}!`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle={
        <>
          Ainda não tem conta? <Link to={`/cadastro?next=${encodeURIComponent(next)}`}>Cadastre-se</Link>
        </>
      }
    >
      <form className={s.form} onSubmit={submit} noValidate>
        <Input label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput label="Senha" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className={s.row}>
          <span />
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" block loading={loading} icon={<LogIn size={18} />}>
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
