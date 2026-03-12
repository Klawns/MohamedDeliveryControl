"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BarChart3, ArrowRight, MousePointer2, Smartphone, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);

    // Smooth Tilt Effect logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".hero-content > *", {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power4.out",
            });

            gsap.from(".hero-image-container", {
                scale: 0.8,
                opacity: 0,
                duration: 1.5,
                delay: 0.5,
                ease: "power2.out",
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative pt-32 pb-20 px-6 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-32" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full -ml-32 -mb-32" />

            <div className="container mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                <div className="hero-content lg:w-1/2 text-left">
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
                        <span className="text-white">Gerencie suas</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 glow-text">
                            corridas com maestria
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-10 max-w-lg leading-relaxed font-medium">
                        A revolução no controle de entregas para quem busca agilidade, precisão e design de elite.
                        Otimize sua rota, controle ganhos e domine o asfalto.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/register?plan=starter"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-600/20 text-center active:scale-[0.98] uppercase tracking-widest text-sm"
                        >
                            Começar Agora
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black border border-white/10 transition-all text-center uppercase tracking-widest text-sm"
                        >
                            Acessar Conta
                        </Link>
                    </div>
                </div>

                <div className="lg:w-1/2 relative w-full h-[400px] lg:h-[550px] hero-image-container">
                    {/* Floating Decorative Icons */}
                    <motion.div
                        animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-10 left-10 z-20 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl hidden lg:block"
                    >
                        <BarChart3 className="text-blue-400" size={24} />
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute -bottom-10 right-10 z-20 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl hidden lg:block"
                    >
                        <Smartphone className="text-violet-400" size={24} />
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-1/4 -right-6 z-20 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl hidden lg:block"
                    >
                        <Globe className="text-green-400" size={24} />
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                        className="absolute bottom-1/4 -left-6 z-20 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl hidden lg:block"
                    >
                        <Smartphone className="text-orange-400" size={24} />
                    </motion.div>

                    {/* Main Showcase with Tilt */}
                    <motion.div
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d",
                        }}
                        className="relative w-full h-full group"
                    >
                        {/* Shadow Layer */}
                        <div className="absolute inset-4 bg-blue-600/20 blur-[50px] rounded-[2rem] transition-opacity duration-500 group-hover:opacity-40 opacity-0" />

                        <div className="relative w-full h-full rounded-[2rem] border border-white/10 overflow-hidden bg-slate-900/40 backdrop-blur-md shadow-2xl p-3">
                            <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden bg-slate-950">
                                <Image
                                    src="/assets/dashboard2.png"
                                    alt="Rotta Dashboard"
                                    fill
                                    className="object-cover object-top opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                                    priority
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                            </div>
                        </div>

                        {/* Interactive HUD element */}
                        <motion.div
                            style={{ translateZ: "50px" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30"
                        >
                            <Link
                                href="/register?plan=starter"
                                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 whitespace-nowrap transition-colors active:scale-95"
                            >
                                <MousePointer2 size={14} />
                                Explore o Sistema
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
