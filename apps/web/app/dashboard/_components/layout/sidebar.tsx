"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/use-auth";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
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

    useBodyScrollLock(swipe.shouldLockBodyScroll);

    const handleMenuClick = () => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <div
                {...swipe.edgeZoneProps}
                aria-hidden={!swipe.canUseEdgeZone}
                className={cn(
                    "fixed inset-y-0 z-[70] bg-transparent lg:hidden",
                    swipe.canUseEdgeZone ? "pointer-events-auto" : "pointer-events-none"
                )}
                style={{
                    left: swipe.edgeZoneOffset,
                    overscrollBehaviorX: "none",
                    touchAction: "pan-y",
                    WebkitTapHighlightColor: "transparent",
                    width: MOBILE_SIDEBAR_EDGE_SWIPE_WIDTH,
                }}
            />

            <motion.div
                aria-hidden={!swipe.shouldShowOverlay}
                onClick={swipe.handleOverlayClick}
                className={cn(
                    "fixed inset-0 z-[80] bg-overlay-background backdrop-blur-sm lg:hidden",
                    swipe.shouldShowOverlay ? "pointer-events-auto" : "pointer-events-none"
                )}
                style={{
                    opacity: swipe.overlayOpacity,
                    overscrollBehaviorX: "none",
                    WebkitTapHighlightColor: "transparent",
                }}
            />

            <motion.aside
                {...swipe.drawerGestureProps}
                className="fixed inset-y-0 left-0 z-[90] flex w-72 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar-background backdrop-blur-xl select-none lg:hidden"
                style={{
                    overscrollBehaviorX: "none",
                    touchAction: "pan-y",
                    WebkitTapHighlightColor: "transparent",
                    willChange: "transform",
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
                    isOpen ? "lg:w-72" : "lg:w-[88px]"
                )}
            >
                <div
                    className={cn(
                        'flex h-full flex-col lg:min-w-0',
                        isOpen ? 'min-w-[18rem] p-6' : 'px-2 py-4',
                    )}
                >
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
