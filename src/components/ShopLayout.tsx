import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  Wrench,
  FileText,
  Receipt,
  Package,
  DollarSign,
  BarChart3,
  UserCog,
  Settings,
  BookOpen,
  LogOut,
  Menu,
  X,
  Bell,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: '/calendar', label: 'Calendar', icon: <Calendar className="h-5 w-5" /> },
  { to: '/customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
  { to: '/vehicles', label: 'Vehicles', icon: <Car className="h-5 w-5" /> },
  { to: '/repair-orders', label: 'Repair Orders', icon: <Wrench className="h-5 w-5" /> },
  { to: '/estimates', label: 'Estimates', icon: <FileText className="h-5 w-5" /> },
  { to: '/invoices', label: 'Invoices', icon: <Receipt className="h-5 w-5" /> },
  { to: '/inventory', label: 'Inventory', icon: <Package className="h-5 w-5" /> },
  { to: '/repair-guides', label: 'Repair Guides', icon: <BookOpen className="h-5 w-5" /> },
  { to: '/expenses', label: 'Expenses', icon: <DollarSign className="h-5 w-5" />, roles: ['owner', 'admin'] },
  { to: '/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, roles: ['owner', 'admin'] },
  { to: '/employees', label: 'Employees', icon: <UserCog className="h-5 w-5" />, roles: ['owner'] },
  { to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, roles: ['owner', 'admin'] },
];

function NotificationIcon({ type }: { type: string }) {
  if (type.includes('appointment')) return <Calendar className="h-4 w-4 text-blue-600" />;
  if (type.includes('repair')) return <Wrench className="h-4 w-4 text-orange-600" />;
  if (type.includes('estimate')) return <FileText className="h-4 w-4 text-indigo-600" />;
  if (type.includes('invoice')) return <Receipt className="h-4 w-4 text-cyan-600" />;
  if (type.includes('payment')) return <DollarSign className="h-4 w-4 text-green-600" />;
  return <Clock className="h-4 w-4 text-gray-500" />;
}

export function ShopLayout({ children }: { children: ReactNode }) {
  const { member, shop, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const filteredNav = navItems.filter(
    (item) => !item.roles || (member && item.roles.includes(member.role))
  );

  const currentPage = filteredNav.find((item) => location.pathname.startsWith(item.to));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (shop) loadNotifications();
  }, [shop]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    if (!shop) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) ?? []);
  }

  async function markAllRead() {
    if (!shop) return;
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    }
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[#284d5b] bg-[#173746] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <img src="/images/GarageHQ_Logo.jpg" alt="GarageHQ Shop Management" className="h-11 w-full object-contain object-left" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#d8a653] text-[#173746]' : 'text-[#dbe4e5] hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8a653] text-sm font-bold text-[#173746]">
              {member?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{member?.full_name}</p>
              <p className="truncate text-xs capitalize text-gray-400">{member?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#dbe4e5] hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage?.label ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-[#49636b]">{shop?.name}</span>
            </div>

            {/* Notifications dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-lg p-2 text-[#49636b] hover:bg-[#f5f1e8] transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d8a653] px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <CheckCircle2 className="mb-2 h-8 w-8 text-gray-200" />
                        <p className="text-sm text-gray-500">All caught up!</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 hover:bg-gray-50 transition-colors ${
                            !n.is_read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <NotificationIcon type={n.type} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500">{n.message}</p>
                            <p className="mt-0.5 text-[10px] text-gray-400">{formatDateTime(n.created_at)}</p>
                          </div>
                          {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
