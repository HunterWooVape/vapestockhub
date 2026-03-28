import Link from 'next/link'

import { getTrackedContactHref, siteConfig } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-teal-DEFAULT rounded flex items-center justify-center">
                <span className="text-background font-bold text-sm">V</span>
              </div>
              <span className="font-bold text-lg tracking-tight">
                VapeStock<span className="text-teal-DEFAULT">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-muted max-w-sm">
              A B2B inventory hub for global vape stock. Browse active wholesale listings by market, brand, and price range before moving into direct inquiry.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/inventory" className="hover:text-foreground transition-colors">Browse Inventory</Link></li>
              <li><Link href="/market" className="hover:text-foreground transition-colors">Find by Market</Link></li>
              <li><Link href="/brand" className="hover:text-foreground transition-colors">Find by Brand</Link></li>
              <li><Link href="/price" className="hover:text-foreground transition-colors">Find by Price</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href={getTrackedContactHref({ channel: 'telegram', sourcePageType: 'contact', sourcePageSlug: 'footer' })} className="hover:text-teal-DEFAULT transition-colors">Telegram Support</a></li>
              <li><a href={getTrackedContactHref({ channel: 'whatsapp', sourcePageType: 'contact', sourcePageSlug: 'footer' })} className="hover:text-teal-DEFAULT transition-colors">WhatsApp Sales</a></li>
              <li><a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-foreground transition-colors">{siteConfig.contactEmail}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} VapeStockHub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/compliance" className="hover:text-foreground transition-colors">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
