"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/use-auth";
import { useSidebarSwipe } from "../../_hooks/use-sidebar-swipe";
import { MenuItem } from "../../_hooks/use-sidebar-state";
import {
    MOBILE_SIDEBAR_DRAWER_WIDTH,
    MOBILE_SIDEBAR_EDGE_SWIPE_WIDTH,
} from "../../_services/sidebar-swipe-service";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNavigation } from "./sidebar-navigation";
import { SidebarFooter } from "./sidebar-footer";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: User | null;
    menuItems: MenuItem[];
    logout: () => void;
}

export function Sidebar({ isOpen, setIsOpen, user, menuItems, logout }: SidebarProps) {
    const pathname = usePathname();
    const swipe = useSidebarSwipe({
        drawerWidth: MOBILE_SIDEBAR_DRAWER_WIDTH,
        isOpen,
        setIsOpen,
    });

    const handleMenuClick = () => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <div
                {...swipe.edgeZoneProps}
                className="fixed inset-y-0 left-0 z-[70] lg:hidden"
                style={{
                    touchAction: "pan-y",
                    width: MOBILE_SIDEBAR_EDGE_SWIPE_WIDTH,
                }}
            />

            <motion.div
                aria-hidden={!swipe.shouldShowOverlay}
                onClick={() => setIsOpen(false)}
                className={cn(
                    "fixed inset-0 z-[80] bg-overlay-background backdrop-blur-sm lg:hidden",
                    swipe.shouldShowOverlay ? "pointer-events-auto" : "pointer-events-none"
                )}
                style={{ opacity: swipe.overlayOpacity }}
            />

            <motion.aside
                className="fixed inset-y-0 left-0 z-[90] flex w-72 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar-background backdrop-blur-xl transition-transform duration-300 ease-out select-none lg:hidden"
                drag="x"
                dragControls={swipe.dragControls}
                dragElastic={0}
                dragListener={isOpen}
                dragMomentum={false}
                dragConstraints={{ left: -MOBILE_SIDEBAR_DRAWER_WIDTH, right: 0 }}
                onDragStart={swipe.handleDragStart}
                onDragEnd={swipe.handleDragEnd}
                style={{
                    touchAction: "pan-y",
                    width: MOBILE_SIDEBAR_DRAWER_WIDTH,
                    x: swipe.x,
                }}
            >
                <div className="flex h-full min-w-[18rem] flex-col p-6">
                    <SidebarBrand
                        isOpen
                        onToggle={() => setIsOpen(false)}
                        onClose={() => setIsOpen(false)}
                    />

                    <SidebarNavigation
                        isOpen
                        pathname={pathname}
                        menuItems={menuItems}
                        user={user}
                        onItemClick={handleMenuClick}
                    />

                    <SidebarFooter
                        isOpen
                        user={user}
                        onLogout={logout}
                    />
                </div>
            </motion.aside>

            <aside
                className={cn(
                    "hidden fixed inset-y-0 left-0 z-[70] bg-sidebar-background backdrop-blur-xl border-r border-sidebar-border overflow-hidden lg:flex lg:flex-col transition-all duration-500 ease-in-out",
                    isOpen ? "lg:w-72" : "lg:w-24"
                )}
            >
                <div className="flex flex-col h-full p-6 min-w-[18rem] lg:min-w-0">
                    <SidebarBrand
                        isOpen={isOpen}
                        onToggle={() => setIsOpen(!isOpen)}
                        onClose={() => setIsOpen(false)}
                    />

                    <SidebarNavigation
                        isOpen={isOpen}
                        pathname={pathname}
                        menuItems={menuItems}
                        user={user}
                        onItemClick={handleMenuClick}
                    />

                    <SidebarFooter
                        isOpen={isOpen}
                        user={user}
                        onLogout={logout}
                    />
                </div>
            </aside>
        </>
    );
}
