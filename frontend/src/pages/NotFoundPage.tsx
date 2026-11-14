import { Music } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback';
import { useDocumentTitle } from '../hooks';

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada');
  return (
    <div className="container page">
      <EmptyState
        icon={<Music size={38} />}
        title="Ops! Essa nota saiu do tom."
        text="A página que você procura não existe ou foi movida."
        action={{ label: 'Voltar para o início', to: '/' }}
      />
    </div>
  );
}
