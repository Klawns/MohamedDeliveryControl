import { CheckCircle2 } from "lucide-react";

export function SettingsTip() {
    return (
        <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-3xl border border-primary/10">
            <CheckCircle2 className="text-primary shrink-0 mt-0.5" />
            <div>
                <h4 className="font-display font-bold text-text-primary text-sm">Dica Pro</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Organize seus atalhos por distância ou região. Por exemplo, crie um atalho "CENTRO" com valor R$ 15,00
                    e outro "AIRPORT" com valor R$ 80,00. Isso agiliza seu dia a dia em até 80%!
                </p>
            </div>
        </div>
    );
}
