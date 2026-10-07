import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, CalendarClock, ClipboardList, Coins, HelpCircle, LayoutDashboard, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const tabs=[
  {path:'/app/dashboard',label:'Overview',icon:LayoutDashboard},
  {path:'/app/leads',label:'Leads',icon:ClipboardList},
  {path:'/app/responses',label:'Responses',icon:MessageSquare},
  {path:'/app/notifications',label:'Updates',icon:Bell},
  {path:'/app/reminders',label:'Reminders',icon:CalendarClock},
];
function pageTitle(path:string){
  if(path.startsWith('/app/admin'))return 'Marketplace operations';
  if(path.startsWith('/app/settings/credits'))return 'Credits & billing';
  if(path.startsWith('/app/settings'))return 'Account & preferences';
  return tabs.find(tab=>path.startsWith(tab.path))?.label ?? 'Workspace';
}
export default function AppLayout(){
  const location=useLocation();const navigate=useNavigate();const {user}=useAuth();
  const {data:unread=0}=useUnreadNotifications();
  const initial=user?.email?.charAt(0).toUpperCase() || 'U';
  const title=pageTitle(location.pathname);
  return <div className="min-h-screen flex flex-col bg-[#f5f6f8]">
    <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:p-3">Skip to workspace</a>
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-[#142449] text-white flex-col z-40">
      <Link to="/" className="px-7 h-24 flex items-center gap-2 text-3xl font-extrabold tracking-tight">FLEXS<span className="text-orange-300">.</span></Link>
      <div className="px-5 mb-7"><div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3"><p className="text-sm font-semibold">Professional workspace</p><p className="mt-1 text-xs text-white/55">Your business. Your next move.</p></div></div>
      <nav aria-label="Professional navigation" className="px-4 space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 px-4 pb-3">Manage your work</p>
        {tabs.map(({path,label,icon:Icon})=>{
          const active=location.pathname.startsWith(path);
          return <button key={path} onClick={()=>navigate(path)} aria-current={active ? 'page' : undefined} aria-label={path==='/app/notifications' && unread>0 ? `${label}, ${unread} unread` : label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${active ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><Icon className="size-[18px]" /><span>{label}</span>{path==='/app/notifications' && unread>0 && <span aria-hidden="true" className={`ml-auto px-2 py-0.5 rounded-md text-[10px] ${active ? 'bg-primary/10 text-primary' : 'bg-white/15 text-white'}`}>{unread>99 ? '99+' : unread}</span>}</button>;
        })}
      </nav>
      <div className="mt-auto p-4 space-y-1.5 border-t border-white/10">
        <Link to="/app/settings/credits" className="flex gap-3 items-center px-4 py-3 text-sm text-white/70 hover:bg-white/10 rounded-xl"><Coins className="size-[18px]" />Credits & billing</Link>
        <Link to="/support" className="flex gap-3 items-center px-4 py-3 text-sm text-white/70 hover:bg-white/10 rounded-xl"><HelpCircle className="size-[18px]" />Support</Link>
        <Link to="/app/settings" className="flex gap-3 items-center px-4 py-3 text-sm text-white/70 hover:bg-white/10 rounded-xl"><Settings className="size-[18px]" />Settings</Link>
        <div className="px-4 pt-5 pb-2 text-[10px] text-white/40">FLEXS · Independent marketplace</div>
      </div>
    </aside>
    <header className="sticky top-0 z-30 md:ml-64 flex h-20 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-xl px-4 md:px-8">
      <div><p className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-1">Workspace / {title}</p><h1 className="text-lg font-semibold tracking-tight">{title}</h1></div>
      <div className="flex items-center gap-3"><Link to="/my-requests" className="hidden lg:inline-flex gap-1.5 items-center text-xs text-muted-foreground mr-3">Customer view<ArrowUpRight className="size-3.5" /></Link><button aria-label="Settings" onClick={()=>navigate('/app/settings')} className="size-10 grid place-items-center rounded-xl border bg-white hover:bg-muted"><Settings className="size-4 text-muted-foreground" /></button><button aria-label="Account settings" onClick={()=>navigate('/app/settings')}><Avatar className="size-10"><AvatarFallback className="bg-orange-100 text-orange-900 text-sm font-semibold">{initial}</AvatarFallback></Avatar></button></div>
    </header>
    <main id="workspace-content" className="flex-1 min-w-0 md:ml-64"><Outlet /></main>
    <nav aria-label="Mobile professional navigation" className="sticky bottom-0 z-30 border-t bg-white/95 backdrop-blur-xl pb-safe md:hidden"><div className="flex min-h-16">{tabs.map(({path,label,icon:Icon})=>{
      const active=location.pathname.startsWith(path);
      return <button key={path} onClick={()=>navigate(path)} aria-current={active ? 'page' : undefined} aria-label={path==='/app/notifications' && unread>0 ? `${label}, ${unread} unread` : label} className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-3 ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}><Icon className="size-5" /><span className="text-[10px]">{label}{path==='/app/notifications' && unread>0 && <span aria-hidden="true" className="ml-1 text-[9px] bg-primary text-white rounded-full px-1">{unread>99 ? '99+' : unread}</span>}</span></button>;
    })}</div></nav>
  </div>;
}
