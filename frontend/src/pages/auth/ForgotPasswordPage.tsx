import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authService } from '../../services/accountService';
import { errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import { isValidEmail } from '../../utils/format';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { AuthShell } from './AuthShell';
import s from './Auth.module.css';

export default function ForgotPasswordPage() {
  useDocumentTitle('Recuperar senha');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.');
    setLoading(true);
    setError(null);
    try {
      const r = await authService.forgotPassword(email.trim());
      setSent(r.detail);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.">
      {sent ? (
        <div className={s.success}>
          <MailCheck size={48} />
          <p>{sent}</p>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Verifique também a caixa de spam. O link expira em alguns minutos.
          </p>
          <Button variant="outline" to="/entrar">
            Voltar ao login
          </Button>
        </div>
      ) : (
        <form className={s.form} onSubmit={submit} noValidate>
          <Input label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" size="lg" block loading={loading}>
            Enviar link de recuperação
          </Button>
          <p className={s.alt}>
            Lembrou a senha? <Link to="/entrar">Entrar</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
