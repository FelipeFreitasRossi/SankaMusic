import { useParams } from 'react-router-dom';
import { INFO_PAGES } from '../utils/store';
import { useDocumentTitle } from '../hooks';
import { Breadcrumbs } from '../components/ui/Navigation';
import NotFoundPage from './NotFoundPage';

export default function InfoPage() {
  const { slug = '' } = useParams();
  const page = INFO_PAGES[slug];
  useDocumentTitle(page?.title);
  if (!page) return <NotFoundPage />;
  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: page.title }]} />
      <h1 className="page-title">{page.title}</h1>
      <div className="card" style={{ padding: 'clamp(20px, 4vw, 40px)', marginTop: 20, lineHeight: 1.75, color: 'var(--gray-700)' }}>
        {page.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
