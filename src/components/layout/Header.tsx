import Link from 'next/link'
import { Search } from 'lucide-react'

import { getTrackedContactHref } from '@/lib/site'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-DEFAULT rounded-md flex items-center justify-center">
            <span className="text-background font-bold text-lg">V</span>
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            VapeStock<span className="text-teal-DEFAULT">Hub</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/inventory" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Inventory
          </Link>
          <Link href="/market" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Markets
          </Link>
          <Link href="/brand" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Brands
          </Link>
          <Link href="/price" className="text-sm font-medium text-teal-DEFAULT hover:text-teal-hover transition-colors">
            Price Range
          </Link>
          <Link href="/blog" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Blog
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <a
            href={getTrackedContactHref({
              channel: 'telegram',
              sourcePageType: 'home',
              sourcePageSlug: 'header-support',
            })}
            className="text-sm font-medium text-foreground hover:text-teal-DEFAULT transition-colors hidden sm:block"
          >
            Telegram
          </a>
          <Link 
            href="/inventory"
            className="inline-flex items-center gap-2 text-sm font-medium bg-surface border border-border px-4 py-2 rounded-lg hover:bg-border transition-colors"
          >
            <Search className="h-4 w-4" />
            Search Inventory
          </Link>
        </div>
      </div>
    </header>
  )
}
