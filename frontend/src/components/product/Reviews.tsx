import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { errorMessage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAsync } from '../../hooks';
import type { Product } from '../../types';
import { formatDate } from '../../utils/format';
import { Rating, RatingInput } from '../ui/Commerce';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Field';
import { Alert, Spinner } from '../ui/Feedback';
import { Pagination } from '../ui/Navigation';
import s from './ProductDetail.module.css';

export function Reviews({ product, onReviewed }: { product: Product; onReviewed: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useAsync(() => catalogService.reviews(product.slug, page), [product.slug, page]);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setError('Selecione uma nota de 1 a 5 estrelas.');
    if (comment.trim().length < 3) return setError('Escreva um comentário.');
    setSending(true);
    setError(null);
    try {
      await catalogService.addReview(product.slug, { rating, title: title || undefined, comment });
      toast.success('Avaliação publicada. Obrigado!');
      setFormOpen(false);
      setRating(0);
      setTitle('');
      setComment('');
      reload();
      onReviewed();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={s.reviews}>
      <div className={s.reviewSummary}>
        <div className={s.reviewScore}>
          <strong>{product.rating_count ? product.rating_avg.toFixed(1) : '–'}</strong>
          <Rating value={product.rating_avg} size={18} />
          <span>{product.rating_count} avaliações</span>
        </div>
        <div>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Apenas clientes que compraram este produto podem avaliá-lo.
          </p>
          {user ? (
            !formOpen && (
              <Button variant="outline" onClick={() => setFormOpen(true)} icon={<MessageSquare size={16} />}>
                Avaliar produto
              </Button>
            )
          ) : (
            <Button variant="outline" to={`/entrar?next=${encodeURIComponent(location.pathname)}`}>
              Entre para avaliar
            </Button>
          )}
        </div>
      </div>

      {formOpen && (
        <form className={s.reviewForm} onSubmit={submit}>
          <div>
            <span className={s.reviewLabel}>Sua nota</span>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <Input label="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          <Textarea label="Comentário" required value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          {error && <Alert>{error}</Alert>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" loading={sending}>
              Publicar avaliação
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner label="Carregando avaliações..." />
      ) : data && data.items.length > 0 ? (
        <>
          <ul className={s.reviewList}>
            {data.items.map((r) => (
              <li key={r.id}>
                <div className={s.reviewHead}>
                  <span className={s.reviewAvatar}>{r.user_name.charAt(0)}</span>
                  <div>
                    <b>{r.user_name}</b>
                    <small>{formatDate(r.created_at)}</small>
                  </div>
                  <Rating value={r.rating} size={14} />
                </div>
                {r.title && <h4>{r.title}</h4>}
                <p>{r.comment}</p>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      ) : (
        <p className="muted">Este produto ainda não possui avaliações.</p>
      )}
    </div>
  );
}
