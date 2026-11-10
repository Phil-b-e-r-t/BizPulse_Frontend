import { LayoutDashboard, ShoppingCart, Boxes, ArrowLeftRight, Receipt, MessageSquare, Settings, Menu, Users, MonitorSmartphone, CreditCard, FileText, TrendingUp, BarChart3, ScrollText } from 'lucide-react';

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

// Super admin navigation (role "superadmin"). The server also enforces this role on every /admin endpoint.
export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, built: true, end: true },
  { to: '/admin/accounts', label: 'Accounts', icon: Users, built: true },
  { to: '/admin/sessions', label: 'Sessions', icon: MonitorSmartphone, built: true },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, built: true },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText, built: true },
  { to: '/admin/finance', label: 'Financial reports', icon: TrendingUp, built: true },
  { to: '/admin/reports', label: 'Report center', icon: BarChart3, built: true },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, built: true },
  { to: '/admin/settings', label: 'System settings', icon: Settings, built: true },
];
export const ADMIN_MOBILE_TABS = ['/admin', '/admin/accounts', '/admin/sessions', '/admin/invoices'];
export const navItemsFor = (role) => (role === 'superadmin' ? ADMIN_NAV_ITEMS : NAV_ITEMS.filter((i) => canSee(i, role)));
export const mobileTabsFor = (role) => (role === 'superadmin' ? ADMIN_MOBILE_TABS : MOBILE_TABS);

// Mobile bottom bar (handoff section 5, screen 2): Dashboard, Sell, Stock, Messages, More.
export const MOBILE_TABS = ['/', '/sell', '/inventory', '/messages'];
export const MORE_ITEM = { to: '/more', label: 'More', icon: Menu };

export const canSee = (item, role) => !item.roles || item.roles.includes(role);

export function titleFor(pathname) {
  if (pathname === '/more') return 'More';
  const all = [...ADMIN_NAV_ITEMS, ...NAV_ITEMS];
  return all.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))?.label || 'BizPulse';
}
