import { LayoutDashboard, ShoppingCart, Boxes, ArrowLeftRight, Receipt, MessageSquare, Settings, Menu } from 'lucide-react';

// `built: false` routes render a "coming next" page. Roles follow the handoff's permission table:
// accountants are read-only, so they don't see Sell or Expenses. Settings (WhatsApp, staff, billing) is owner-only.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, built: true, end: true },
  { to: '/sell', label: 'Sell', icon: ShoppingCart, built: true, roles: ['owner', 'staff'] },
  { to: '/inventory', label: 'Stock', icon: Boxes, built: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, built: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt, built: true, roles: ['owner', 'staff'] },
  { to: '/messages', label: 'Messages', icon: MessageSquare, built: true },
  { to: '/settings', label: 'Settings', icon: Settings, built: true, roles: ['owner'] },
];

// Mobile bottom bar (handoff section 5, screen 2): Dashboard, Sell, Stock, Messages, More.
export const MOBILE_TABS = ['/', '/sell', '/inventory', '/messages'];
export const MORE_ITEM = { to: '/more', label: 'More', icon: Menu };

export const canSee = (item, role) => !item.roles || item.roles.includes(role);

export function titleFor(pathname) {
  if (pathname === '/more') return 'More';
  return NAV_ITEMS.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))?.label || 'BizPulse';
}
