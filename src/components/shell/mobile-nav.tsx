'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Home,
  FolderOpen,
  Briefcase,
  User,
  Mail,
  Github,
  Linkedin,
} from 'lucide-react';
import UIButton from '@/components/UIButton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Experience', href: '/experience', icon: Briefcase },
  { name: 'About', href: '/about', icon: User },
  { name: 'Contact', href: '/contact', icon: Mail },
];

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com', icon: Linkedin },
  { name: 'Email', href: 'mailto:', icon: Mail },
];

const normalize = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p);

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Calculate active item (same logic as sidebar)
  const activeHref = React.useMemo(() => {
    const np = normalize(pathname || '/');
    const found = navigation.find(it => normalize(it.href) === np);
    return found?.href ?? navigation[0].href;
  }, [pathname]);

  return (
    <div className="lg:hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between h-16 px-4 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg dark:bg-neutral-900/95 dark:border-neutral-700/50">
        <Link href="/" className="text-xl font-bold text-foreground">
          Sakurimo
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <UIButton variant="ghost" className="lg:hidden">
              <Menu className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </UIButton>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 bg-background/95 backdrop-blur-xl border-l border-border p-0 dark:bg-neutral-900/95 dark:border-neutral-700/50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-6 border-b border-border dark:border-neutral-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                    <span className="text-brand-foreground font-bold text-sm">🌸</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Sakurimo</h2>
                    <p className="text-sm text-muted-foreground">
                      University Tracker • Academic Planner
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map(item => {
                  const isActive = normalize(item.href) === normalize(activeHref);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand/20 to-brand/10 text-foreground border border-brand/30 shadow-lg shadow-brand/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-brand/10 hover:border-brand/20 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800/60 dark:hover:border-neutral-700/50'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-6 w-6 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-brand'
                            : 'text-muted-foreground group-hover:text-brand dark:text-neutral-400'
                        }`}
                      />
                      <span className="font-semibold">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Social Links */}
              <div className="px-6 py-4 border-t border-border dark:border-neutral-700/50">
                <div className="flex space-x-3">
                  {socialLinks.map(item => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted text-muted-foreground hover:text-brand hover:bg-accent transition-all duration-200 hover:scale-105 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-brand/10"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
