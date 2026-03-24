"use client";

import { LucideIcon } from "lucide-react";

interface TutorialHeaderProps {
    title: string;
    Icon: LucideIcon;
}

export function TutorialHeader({ title, Icon }: TutorialHeaderProps) {
    return (
        <header className="space-y-2 md:space-y-5">
            <div className="inline-flex p-3 md:p-5 rounded-xl md:rounded-[2rem] bg-blue-600/10 text-blue-500 border border-blue-500/10 shadow-3xl">
                <Icon size={24} className="md:w-9 md:h-9" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                {title}
            </h1>
        </header>
    );
}
