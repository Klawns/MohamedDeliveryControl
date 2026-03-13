"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike,
    Users,
    Settings,
    Smartphone,
    FileText,
    MousePointer2,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Plus,
    X,
    LayoutDashboard,
    Zap,
    History,
    ChevronRight,
    Search,
    MapPin,
    DollarSign,
    Wallet,
    Calendar,
    CalendarDays,
    BarChart3,
    Filter,
    Save,
    Camera,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

// --- Mock Components for Simulator ---

function SimulatorShortcuts({ presets, onAdd }: any) {
    const [newVal, setNewVal] = useState("");
    const [newLoc, setNewLoc] = useState("");

    const handleAdd = () => {
        if (newVal && newLoc) {
            onAdd({ label: newLoc.toUpperCase(), value: Number(newVal) });
            setNewVal("");
            setNewLoc("");
        }
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-5 md:p-6 shadow-2xl space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                    <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Configurar Novo Atalho</h4>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-3.5 text-slate-500" />
                                <Input
                                    type="number"
                                    value={newVal}
                                    onChange={e => setNewVal(e.target.value)}
                                    placeholder="Valor"
                                    className="bg-slate-950 border-white/10 pl-8 h-11 md:h-12 rounded-xl text-xs md:text-sm"
                                />
                            </div>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-3 top-3.5 text-slate-500" />
                                <Input
                                    value={newLoc}
                                    onChange={e => setNewLoc(e.target.value)}
                                    placeholder="Local"
                                    className="bg-slate-950 border-white/10 pl-8 h-11 md:h-12 rounded-xl text-xs md:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleAdd} className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-600/20 text-xs md:text-sm">
                        Adicionar Atalho <Plus className="ml-2" size={14} />
                    </Button>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Sua Barra de Atalhos</h4>
                    <div className="flex flex-wrap gap-2">
                        {presets.map((p: any) => (
                            <div key={p.label} className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                                <span className="text-xs md:text-sm font-black text-white">R$ {p.value}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">{p.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SimulatorClientSelector({ onSelect, clients, onAddClient }: any) {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState("");

    const handleAdd = () => {
        if (name) {
            onAddClient(name);
            setName("");
            setIsAdding(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Selecione o Cliente</h4>
                <div className="h-0.5 flex-1 mx-4 bg-white/5 rounded-full" />
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {clients.map((c: any) => (
                    <button
                        key={c.name}
                        onClick={() => onSelect(c)}
                        className="p-3 md:p-4 bg-slate-800 border border-white/5 rounded-xl md:rounded-2xl text-left hover:border-blue-500/50 transition-all group"
                    >
                        <p className="text-white font-bold text-sm md:text-base group-hover:text-blue-400 transition-colors uppercase truncate">{c.name}</p>
                    </button>
                ))}

                {isAdding ? (
                    <div className="col-span-1 xs:col-span-2 flex gap-2">
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nome..."
                            className="bg-slate-950 border-white/10 h-11 text-sm"
                            autoFocus
                        />
                        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 font-bold px-4 h-11">Add</Button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-3 md:p-4 border-2 border-dashed border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
                    >
                        <Plus size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

function SimulatorRideForm({ client, presets, onComplete }: any) {
    const [val, setVal] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);

    const handleSimulatedPhoto = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTempPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="p-3 md:p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl md:rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {client.name.charAt(0)}
                </div>
                <div>
                    <p className="text-[9px] md:text-xs text-blue-400 font-bold uppercase tracking-widest">Cliente Ativo</p>
                    <p className="text-white font-black text-sm md:text-base leading-none">{client.name}</p>
                </div>
            </div>

            <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Preço da Corrida</label>
                <div className="grid grid-cols-3 gap-2">
                    {presets.map((p: any) => (
                        <button
                            key={p.label}
                            onClick={() => setVal(p.value)}
                            className={cn(
                                "h-12 md:h-14 rounded-xl font-black text-xs md:text-sm transition-all border",
                                val === p.value
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                    : "bg-slate-800 border-white/5 text-slate-400 hover:border-white/20"
                            )}
                        >
                            R$ {p.value}
                            <span className="block text-[7px] md:text-[8px] opacity-60 font-medium truncate">{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Obs & Foto <span className="lowercase italic opacity-50 font-medium">(opcional)</span></label>
                    <label className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/10 rounded-lg text-blue-400 cursor-pointer text-[9px] font-black uppercase md:text-[10px]">
                        <Camera size={12} /> Foto
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSimulatedPhoto} />
                    </label>
                </div>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Deixado na garagem..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-xs min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />

                <AnimatePresence>
                    {tempPhoto && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-blue-500/30">
                            <img src={tempPhoto} alt="Preview" className="w-full h-full object-cover" />
                            <button onClick={() => setTempPhoto(null)} className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Trash2 size={16} className="text-white" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Button
                disabled={!val}
                onClick={onComplete}
                className="w-full h-12 md:h-14 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl md:rounded-2xl shadow-lg shadow-emerald-500/20 text-base md:text-lg transition-all active:scale-95"
            >
                Finalizar Registro <Zap className="ml-2 fill-current" size={18} />
            </Button>
        </div>
    );
}

function SimulatorNavigation() {
    const items = [
        { icon: LayoutDashboard, label: "Visão Geral", desc: "Seu resumo de ganhos", color: "text-blue-400" },
        { icon: Users, label: "Clientes", desc: "Lista de todos seus clientes", color: "text-emerald-400" },
        { icon: Bike, label: "Corridas", desc: "Histórico completo com filtros", color: "text-violet-400" },
        { icon: Wallet, label: "Financeiro", desc: "Exportação de PDFs e cobranças", color: "text-amber-400" },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2rem] overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Mock Explorer</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div key={item.label} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group">
                            <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", item.color)}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white leading-none">{item.label}</h4>
                                <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SimulatorPDFExport() {
    const [period, setPeriod] = useState("day");

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="space-y-4 md:space-y-6 relative z-10">
                    <div className="space-y-2">
                        <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Selecione o Período</h4>
                        <div className="flex gap-1.5 md:gap-2">
                            {[
                                { id: "day", label: "Hoje", icon: Calendar },
                                { id: "week", label: "Semana", icon: CalendarDays },
                                { id: "month", label: "Mês", icon: DollarSign }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    className={cn(
                                        "flex-1 h-10 md:h-12 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 font-bold text-[10px] md:text-xs transition-all border",
                                        period === p.id
                                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                            : "bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-800/80"
                                    )}
                                >
                                    <p.icon size={12} className="md:w-3.5 md:h-3.5" />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-950 border border-white/5 rounded-2xl md:rounded-3xl space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Preview PDF</span>
                            <div className="h-5 md:h-6 px-1.5 md:px-2 bg-emerald-500/10 text-emerald-400 rounded-md text-[7px] md:text-[8px] font-black flex items-center tracking-tighter uppercase">PRONTO</div>
                        </div>
                        <div className="h-0.5 w-full bg-white/5" />
                        <div className="space-y-2 md:space-y-3 opacity-60">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between text-[8px] md:text-[10px] font-medium text-slate-400">
                                    <div className="flex gap-2">
                                        <div className="w-6 md:w-8 h-1.5 md:h-2 bg-white/10 rounded" />
                                        <div className="w-12 md:w-16 h-1.5 md:h-2 bg-white/10 rounded" />
                                    </div>
                                    <div className="w-8 md:w-10 h-1.5 md:h-2 bg-white/10 rounded" />
                                </div>
                            ))}
                        </div>
                        <div className="h-0.5 w-full bg-white/5" />
                        <div className="flex items-center justify-between font-black text-white text-[10px] md:text-xs">
                            <span>TOTAL NO PERÍODO</span>
                            <span className="text-blue-400 whitespace-nowrap">R$ {period === 'day' ? '125,00' : period === 'week' ? '850,00' : '3.420,00'}</span>
                        </div>
                    </div>

                    <Button className="w-full h-12 md:h-14 bg-white text-slate-950 hover:bg-white/90 font-black rounded-xl md:rounded-2xl text-sm md:text-lg shadow-lg">
                        Baixar PDF <ArrowRight className="ml-2" size={18} />
                    </Button>
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/5 blur-[100px] -ml-32 -mb-32 rounded-full" />
            </div>
        </div>
    );
}

// --- Main Tutorial Stages ---

export default function TutorialPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [simClients, setSimClients] = useState([{ name: "João Silva" }, { name: "Maria Oliveira" }]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [simPresets, setSimPresets] = useState([
        { label: "MÉDIA", value: 15 },
        { label: "LONGA", value: 25 }
    ]);
    const [isFinished, setIsFinished] = useState(false);

    const steps = [
        {
            title: "O que é o Rotta?",
            icon: Bike,
            content: (
                <div className="space-y-6">
                    <div className="aspect-video bg-slate-800/50 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                        {/* 
                            DICA: Para colocar um vídeo ou GIF real aqui, basta substituir o motion.div abaixo por:
                            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                                <source src="/assets/tutorial_intro.mp4" type="video/mp4" />
                            </video>
                        */}
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600/10 to-transparent"
                        >
                            <LayoutDashboard size={100} className="text-blue-500/20" />
                        </motion.div>

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="p-5 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/40 animate-pulse">
                                <Zap className="text-white fill-current" size={32} />
                            </div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Mídia de Demonstração</span>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-6 md:p-8">
                            <div className="flex items-center gap-4">
                                <div className="hidden xs:flex w-1 h-12 bg-blue-600 rounded-full" />
                                <div>
                                    <h4 className="text-white font-black text-lg italic uppercase tracking-tighter">Velocidade Máxima</h4>
                                    <p className="text-slate-400 text-xs md:text-sm font-medium">Registro ultra-rápido para quem está na rua.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                        O Rotta foi desenhado para profissionais que valorizam cada segundo.
                        Esqueça cadernetas ou planilhas. Aqui seu foco é rodar, o nosso é <span className="text-blue-400 font-bold underline decoration-blue-500/30 underline-offset-4">organizar seu faturamento</span> automaticamente.
                    </p>
                </div>
            )
        },
        {
            title: "Poder dos Atalhos",
            icon: Settings,
            content: (
                <div className="space-y-6 text-left">
                    <SimulatorShortcuts
                        presets={simPresets}
                        onAdd={(p: any) => setSimPresets(prev => [...prev, p])}
                    />
                    <p className="text-slate-400 leading-relaxed">
                        Experimente criar um atalho acima (ex: R$ 10 - CENTRO).
                        Esses botões aparecerão na sua tela de registro para agilizar seu trabalho na rua.
                        <span className="text-blue-400 font-bold block mt-2">Dica: Configure isso uma vez e ganhe 80% de produtividade!</span>
                    </p>
                </div>
            )
        },
        {
            title: "Simulador: Cadastro",
            icon: Zap,
            content: (
                <div className="space-y-6">
                    <div className="glass-card bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                        <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg pulse-shadow uppercase tracking-widest">Pratique Agora</div>

                        {!selectedClient ? (
                            <SimulatorClientSelector
                                clients={simClients}
                                onSelect={setSelectedClient}
                                onAddClient={(name: string) => setSimClients(prev => [...prev, { name }])}
                            />
                        ) : (
                            <SimulatorRideForm
                                client={selectedClient}
                                presets={simPresets.length > 0 ? simPresets : [{ label: "EXTRA", value: 10 }]}
                                onComplete={() => {
                                    setSelectedClient(null);
                                    setIsFinished(true);
                                    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
                                }}
                            />
                        )}
                    </div>
                    {!selectedClient && (
                        <div className="flex items-center gap-3 p-5 bg-white/5 rounded-3xl border border-white/5">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}><Plus className="text-blue-500" size={24} /></motion.div>
                            <p className="text-sm text-slate-400 font-bold italic lowercase">Tente selecionar um cliente ou criar um novo no simulador acima.</p>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "Onde encontrar?",
            icon: Search,
            content: (
                <div className="space-y-6">
                    <SimulatorNavigation />
                    <p className="text-slate-400 leading-relaxed">
                        No menu lateral (ou no topo em mobile), você navega entre suas listas.
                        <span className="text-emerald-400 font-bold block mt-2">Dica: O Dashboard mostra um resumo rápido do dia assim que você abre o app.</span>
                    </p>
                </div>
            )
        },
        {
            title: "Exportação PDF",
            icon: Filter,
            content: (
                <div className="space-y-6">
                    <SimulatorPDFExport />
                    <p className="text-slate-400 leading-relaxed">
                        Escolha o período e gere relatórios profissionais. Use filtros na tela de <b>Corridas</b> para encontrar registros específicos por cliente ou data.
                    </p>
                </div>
            )
        },
        {
            title: "Controle Total",
            icon: BarChart3,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-8 bg-slate-800/40 rounded-[2rem] border border-white/5 text-center group hover:bg-emerald-500/10 transition-all">
                            <History className="mx-auto text-emerald-400 mb-4 group-hover:scale-110 transition-transform" size={40} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Histórico</p>
                        </div>
                        <div className="p-8 bg-slate-800/40 rounded-[2rem] border border-white/5 text-center group hover:bg-violet-500/10 transition-all">
                            <BarChart3 className="mx-auto text-violet-400 mb-4 group-hover:scale-110 transition-transform" size={40} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Ganhos</p>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        Acompanhe quanto cada cliente deve, veja seu faturamento total e receba sugestões para otimizar suas rotas.
                        Tudo pronto para você crescer.
                    </p>
                </div>
            )
        }
    ];

    const next = () => {
        if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    }

    const prev = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    }

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="max-w-2xl mx-auto min-h-[90vh] flex flex-col justify-center py-6 md:py-12 px-4">
            {/* Header Progress */}
            <div className="mb-8 md:mb-12 flex items-center justify-between">
                <div className="flex gap-1.5 md:gap-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 md:h-2 rounded-full transition-all duration-700",
                                i <= currentStep ? "w-6 md:w-10 bg-blue-600" : "w-2 md:w-3 bg-slate-800"
                            )}
                        />
                    ))}
                </div>
                <span className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] italic">{currentStep + 1} / {steps.length} STEP</span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ ease: "circOut", duration: 0.5 }}
                    className="flex-1 space-y-6 md:space-y-10"
                >
                    <header className="space-y-3 md:space-y-5">
                        <div className="inline-flex p-4 md:p-5 rounded-2xl md:rounded-[2rem] bg-blue-600/10 text-blue-500 border border-blue-500/10 shadow-3xl">
                            {<CurrentIcon size={28} className="md:w-9 md:h-9" strokeWidth={2.5} />}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{steps[currentStep].title}</h1>
                    </header>

                    <div className="min-h-[300px] md:min-h-[350px]">
                        {steps[currentStep].content}
                    </div>
                </motion.div>
            </AnimatePresence>

            <footer className="mt-8 md:mt-14 pt-6 md:pt-10 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
                {currentStep > 0 && (
                    <Button
                        variant="ghost"
                        onClick={prev}
                        className="h-12 md:h-16 px-6 md:px-8 rounded-2xl md:rounded-3xl text-slate-500 hover:text-white font-black scale-95 hover:scale-100 transition-all uppercase tracking-widest text-[10px] md:text-xs text-center"
                    >
                        <ArrowLeft className="mr-2 md:mr-3 shrink-0" size={16} /> Voltar
                    </Button>
                )}

                {currentStep < steps.length - 1 ? (
                    <Button
                        onClick={next}
                        className="h-14 md:h-16 flex-1 bg-white text-slate-950 hover:bg-slate-200 font-black rounded-2xl md:rounded-3xl text-sm md:text-lg shadow-2xl transition-all active:scale-95 group uppercase tracking-tight"
                    >
                        {currentStep === 2 && !selectedClient ? "Siga as instruções acima" : "Continuar"} <ArrowRight className="ml-2 md:ml-3 group-hover:translate-x-1 transition-transform shrink-0" size={18} />
                    </Button>
                ) : (
                    <Link href="/dashboard" className="flex-1">
                        <Button
                            className="w-full h-14 md:h-16 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black rounded-2xl md:rounded-3xl text-lg md:text-xl shadow-2xl shadow-blue-600/30 active:scale-95 group uppercase tracking-tighter italic"
                        >
                            Começar Agora <CheckCircle2 className="ml-2 md:ml-3 shrink-0" size={22} />
                        </Button>
                    </Link>
                )}
            </footer>

            {/* Custom Animations Style */}
            <style jsx global>{`
                @keyframes pulse-shadow {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                .pulse-shadow {
                    animation: pulse-shadow 2s infinite;
                }
                .shadow-3xl {
                    box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.2);
                }
            `}</style>
        </div>
    );
}
