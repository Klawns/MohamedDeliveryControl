import { CheckCircle2, MapPin, Phone, User, X } from "lucide-react";
import { type ClientModalController } from "./types";

interface ClientModalViewProps {
  controller: ClientModalController;
}

export function ClientModalView({ controller }: ClientModalViewProps) {
  return (
    <div className="relative flex flex-col">
      <button
        type="button"
        onClick={controller.handleClose}
        aria-label="Fechar modal de cliente"
        className="group absolute right-6 top-6 z-20 rounded-xl border border-border-subtle bg-secondary/10 p-2.5 text-text-secondary shadow-lg transition-all hover:bg-secondary/20 hover:text-text-primary"
        title="Fechar"
      >
        <X
          size={20}
          className="transition-transform duration-300 group-hover:rotate-90"
        />
      </button>

      <div className="mx-auto my-4 h-1.5 w-12 shrink-0 rounded-full bg-border-subtle sm:hidden" />

      <div className="shrink-0 px-8 pb-6 pt-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-icon-info/10 bg-icon-info/10 font-black text-icon-info shadow-inner">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black leading-none tracking-tighter text-text-primary sm:text-2xl">
              {controller.title}
            </h2>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary opacity-70 sm:text-xs">
              Base de Dados
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-10">
        <form onSubmit={controller.handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              Nome Completo
            </label>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-icon-brand">
                <User size={18} />
              </div>
              <input
                value={controller.formValues.name}
                onChange={controller.handleFieldChange("name")}
                required
                className="w-full rounded-xl border border-border-subtle bg-background/50 py-3 pl-12 pr-4 font-medium text-text-primary transition-all placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
                placeholder="Ex: Pastelaria do Jhow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              Telefone (opcional)
            </label>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-icon-brand">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={controller.formValues.phone}
                onChange={controller.handleFieldChange("phone")}
                className="w-full rounded-xl border border-border-subtle bg-background/50 py-3 pl-12 pr-4 font-medium text-text-primary transition-all placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              Endereco/Ponto de Referencia (opcional)
            </label>
            <div className="group relative">
              <div className="absolute left-4 top-4 text-text-secondary transition-colors group-focus-within:text-icon-brand">
                <MapPin size={18} />
              </div>
              <textarea
                value={controller.formValues.address}
                onChange={controller.handleFieldChange("address")}
                rows={2}
                className="w-full resize-none rounded-xl border border-border-subtle bg-background/50 py-3 pl-12 pr-4 font-medium text-text-primary transition-all placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
                placeholder="Rua Exemplo, 123..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={controller.isSubmitDisabled}
            className="group mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-button-primary py-4 text-base font-black text-button-primary-foreground shadow-lg shadow-button-shadow transition-all active:scale-[0.98] hover:bg-button-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {controller.isSubmitting ? (
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <>
                {controller.submitLabel}
                <CheckCircle2
                  size={24}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
