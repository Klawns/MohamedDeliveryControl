import { Plus } from 'lucide-react';

interface ClientHeaderProps {
  onNewClient: () => void;
  totalCount: number;
  hasActiveSearch: boolean;
}

export function ClientHeader({
  onNewClient,
  totalCount,
  hasActiveSearch,
}: ClientHeaderProps) {
  const summary =
    totalCount === 0
      ? 'Nenhum cliente encontrado no recorte atual.'
      : `${totalCount} ${
          totalCount === 1 ? 'cliente encontrado' : 'clientes encontrados'
        }${hasActiveSearch ? ' com a busca atual.' : ' na sua base atual.'}`;

  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-text-primary">
            Meus Clientes
          </h1>
          <p className="mt-1 text-base text-text-secondary">
            Consulte sua base com mais rapidez e abra os detalhes sem sair da pagina.
          </p>
        </div>

        <p className="text-sm font-medium text-text-secondary/85">{summary}</p>
      </div>

      <button
        onClick={onNewClient}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-button-primary px-5 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-button-primary-foreground shadow-lg shadow-button-shadow transition-all hover:bg-button-primary-hover active:scale-95"
      >
        <Plus size={18} strokeWidth={3} />
        Novo Cliente
      </button>
    </header>
  );
}
