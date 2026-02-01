'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Megaphone, 
  CalendarDays, 
  BookMarked, 
  Link as LinkIcon, 
  Bell, 
  Settings 
} from 'lucide-react';
import { AuthWidget } from './AuthWidget';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Units', href: '/units', icon: BookOpen },
  { name: 'Assignments', href: '/assignments', icon: ClipboardList },
  { name: 'Exams', href: '/exams', icon: Calendar },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Grades & Progress', href: '/grades', icon: TrendingUp },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Study Planner', href: '/planner', icon: BookMarked },
  { name: 'Resources', href: '/resources', icon: LinkIcon },
  { name: 'Integrations', href: '/integrations', icon: LinkIcon },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const normalize = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p);

export function Sidebar() {
  const pathname = usePathname();
  const activeHref = React.useMemo(() => {
    const np = normalize(pathname || '/');
    const found = navigation.find(it => normalize(it.href) === np);
    return found?.href ?? navigation[0].href;
  }, [pathname]);

  // Refs to nav container and each link
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});

  // Indicator position within the nav container
  const [indicator, setIndicator] = React.useState({ top: 0, height: 0, visible: false });

  const measure = React.useCallback(() => {
    const nav = navRef.current;
    const el = itemRefs.current[activeHref];
    if (!nav || !el) {
      setIndicator(s => ({ ...s, visible: false }));
      return;
    }

    // Compute TOP relative to the nav container using bounding rects (immune to window scroll)
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const top = elRect.top - navRect.top + nav.scrollTop; // add nav.scrollTop in case the nav itself scrolls
    const height = elRect.height;

    setIndicator({ top, height, visible: true });
  }, [activeHref]);

  React.useEffect(() => {
    measure();
  }, [measure]);

  React.useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    // fonts/layout reflow
    if ('fonts' in document && document.fonts && 'ready' in document.fonts) {
      (document.fonts as FontFaceSet).ready.then(measure);
    }
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return (
    <div className="hidden lg:flex lg:w-96 lg:flex-col lg:fixed lg:inset-y-0 z-20">
      {/* NOTE: removed transform-gpu to avoid transform-based layout offsets */}
      <div className="flex flex-col h-screen bg-sidebar/80 backdrop-blur-sm border-r border-sidebar-border shadow-[4px_0_12px_rgba(255,75,138,0.2)] dark:shadow-[4px_0_12px_rgba(255,75,138,0.2)]">
        <div className="flex flex-col h-full pt-5 pb-4">
          {/* Brand */}
          <div className="flex items-center px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-brand-foreground font-bold text-sm">🌸</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Sakurimo</h1>
                <p className="text-sm text-muted-foreground">
                  University Tracker • Academic Planner
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav ref={navRef} className="mt-8 flex-1 px-2 space-y-1 relative">
            <MotionConfig transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}>
              {/* Indicator aligned with the link padding (left-2 right-2 matches link px-2) */}
              <motion.div
                aria-hidden
                className="absolute left-2 right-2 bg-brand/30 border-2 border-brand rounded-md shadow-lg pointer-events-none"
                initial={false}
                animate={{
                  top: indicator.top,
                  height: indicator.height,
                  opacity: indicator.visible ? 1 : 0,
                }}
                style={{ willChange: 'transform' }}
              />
              {navigation.map(item => {
                const isActive = normalize(item.href) === normalize(activeHref);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    ref={el => {
                      itemRefs.current[item.href] = el;
                    }}
                    className="group flex items-center px-2 py-3 text-base font-medium rounded-md relative transition-all duration-200 ease-out hover:bg-brand/10 dark:hover:bg-brand/10 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 flex-shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-sidebar-foreground group-hover:text-brand'}`}
                    />
                    <span
                      className={`transition-colors font-semibold ${isActive ? 'text-brand' : 'text-sidebar-foreground group-hover:text-brand'}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </MotionConfig>
          </nav>

          {/* Quick Stats */}
          <div className="flex-shrink-0 px-2 py-4">
            <div className="bg-sidebar-accent/50 rounded-lg p-3 space-y-2">
              <div className="text-xs text-muted-foreground">Quick Stats</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-semibold text-brand">3</div>
                  <div className="text-xs text-muted-foreground">Due Soon</div>
                </div>
                <div>
                  <div className="font-semibold text-brand">1</div>
                  <div className="text-xs text-muted-foreground">Exams</div>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Widget */}
          <AuthWidget />
        </div>
      </div>
    </div>
  );
}
