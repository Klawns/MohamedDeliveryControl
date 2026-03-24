interface FinanceHeaderProps {
    title: string;
    subtitle: string;
}

export function FinanceHeader({ title, subtitle }: FinanceHeaderProps) {
    return (
        <div>
            <h1 className="text-3xl font-display font-extrabold text-text-primary tracking-tight">{title}</h1>
            <p className="text-text-secondary mt-1">{subtitle}</p>
        </div>
    );
}
