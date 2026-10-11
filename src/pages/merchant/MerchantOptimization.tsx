import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, MessageSquare, UserRound } from 'lucide-react';
import ProviderSalesSummary from '@/components/ProviderSalesSummary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const actions = [
  { title: 'Complete your professional profile', description: 'Keep your services, work examples, and business information current.', href: '/app/settings/profile', label: 'Edit professional profile', icon: UserRound },
  { title: 'Find your next opportunity', description: 'Review customer requests and choose which contacts to unlock.', href: '/merchant/marketplace', label: 'Explore customer requests', icon: ClipboardList },
  { title: 'Follow up on your conversations', description: 'Answer customer questions and manage quotes you have already sent.', href: '/merchant/messages', label: 'Open merchant conversations', icon: MessageSquare },
];

export default function MerchantOptimization() {
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
    <header><p className="text-xs uppercase tracking-widest text-muted-foreground">Your business workspace</p><h1 className="text-3xl font-semibold tracking-tight mt-2">Business performance</h1><p className="text-sm text-muted-foreground mt-3">Review your quote activity and keep your next customer conversation moving.</p></header>
    <ProviderSalesSummary />
    <section aria-label="Business actions" className="grid gap-4 md:grid-cols-3">
      {actions.map(({title,description,href,label,icon:Icon})=><Card key={href} className="rounded-2xl shadow-none"><CardContent className="p-5 flex flex-col h-full gap-4"><Icon className="size-5 text-primary" /><h2 className="text-base font-semibold">{title}</h2><p className="text-sm text-muted-foreground flex-1">{description}</p><Button asChild variant="outline" className="w-full"><Link to={href}>{label}<ArrowUpRight className="size-4 ml-2 shrink-0" /></Link></Button></CardContent></Card>)}
    </section>
    <section aria-label="Analytics availability" className="rounded-2xl border bg-muted/30 p-5 text-sm"><h2 className="font-semibold">Profile traffic analytics</h2><p className="text-muted-foreground mt-2">Profile views, clicks, and click-through rates are not currently measured. Quote activity above comes from your FLEXS account.</p><Link to="/help/takatak" className="inline-flex items-center gap-2 mt-4 text-primary underline underline-offset-4">About the TAKATAK connection<ArrowUpRight className="size-4" /></Link></section>
  </div>;
}
