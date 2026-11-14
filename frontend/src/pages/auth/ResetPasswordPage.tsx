import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { authService } from '../../services/accountService';
import { errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import { passwordProblem } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { AuthShell } from './AuthShell';
import { PasswordInput } from './PasswordInput';
import s from './Auth.module.css';

export default function ResetPasswordPage() {
  useDocumentTitle('Nova senha');
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const pw = passwordProblem(password);
    if (pw) return setError(pw);
    if (password !== confirm) return setError('As senhas não conferem.');
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Link inválido">
        <Alert>O link de redefinição está incompleto. Solicite um novo.</Alert>
        <p className={s.alt}>
          <Link to="/esqueci-senha">Solicitar novo link</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar nova senha" subtitle="Escolha uma senha forte que você não usa em outros sites.">
      {done ? (
        <div className={s.success}>
          <CircleCheck size={48} />
          <p>Senha redefinida com sucesso!</p>
          <Button to="/entrar">Entrar</Button>
        </div>
      ) : (
        <form className={s.form} onSubmit={submit} noValidate>
          <PasswordInput label="Nova senha" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo de 8 caracteres, com letras e números." required />
          <PasswordInput label="Confirme a nova senha" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" size="lg" block loading={loading}>
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
