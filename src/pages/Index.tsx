import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Check, ClipboardList, Hammer, MapPin, Menu, MessageSquare, Search, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Index() {
  const navigate=useNavigate();
  const [service,setService]=useState('');
  const [location,setLocation]=useState('');
  const [menu,setMenu]=useState(false);
  const categories=useQuery({queryKey:['home-categories'],queryFn:async()=>{
    const result=await supabase.from('service_categories').select('id,name,slug,icon,parent_slug').eq('is_active',true).order('sort_order');
    if(result.error)throw new Error('Unable to load services.');return result.data;
  }});
  const reviews=useQuery({queryKey:['home-verified-reviews'],queryFn:async()=>{
    const result=await supabase.from('provider_reviews_public').select('id,rating,review_text,reviewer_name').eq('verified',true).order('created_at',{ascending:false}).limit(3);
    if(result.error)throw new Error('Unable to load reviews.');return result.data;
  }});
  const start=(event:React.FormEvent)=>{
    event.preventDefault();const query=new URLSearchParams();
    if(service.trim())query.set('q',service.trim());if(location.trim())query.set('location',location.trim());
    navigate(`/post-job${query.size ? `?${query}` : ''}`);
  };
  const services=(categories.data ?? []).filter(c=>!c.parent_slug).slice(0,8);
  return <div className="min-h-screen bg-background">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-white focus:p-3">Skip to content</a>
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex justify-between items-center gap-5">
        <Link to="/" className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight"><span className="grid place-items-center size-9 rounded-xl bg-primary text-white text-xl">f<span className="sr-only"> logo</span></span>FLEXS<span className="text-orange-600">.</span></Link>
        <div className="hidden md:flex gap-7 text-sm font-medium items-center"><Link to="/post-job">Find a Pro</Link><Link to="/my-requests">My requests</Link><Link to="/help">Help centre</Link></div>
        <div className="hidden md:flex gap-3 items-center"><Link to="/auth/login" className="text-sm font-medium px-3 py-2">Sign in</Link><Button asChild variant="outline" className="rounded-full"><Link to="/pro">For professionals <ArrowUpRight className="size-4 ml-2" /></Link></Button></div>
        <button aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="mobile-navigation" className="md:hidden size-11 grid place-items-center rounded-xl border" onClick={()=>setMenu(v=>!v)}>{menu ? <X /> : <Menu />}</button>
      </nav>
      {menu && <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden border-t px-5 py-5 grid gap-4 text-sm font-medium">{[['/post-job','Find a Pro'],['/my-requests','My requests'],['/help','Help centre'],['/auth/login','Sign in'],['/pro','For professionals']].map(([to,label])=><Link key={to} to={to} onClick={()=>setMenu(false)}>{label}</Link>)}</nav>}
    </header>
    <main id="main-content">
      <section className="bg-[#f6f4ef] overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 lg:py-24 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 items-center">
          <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><span className="size-2 rounded-full bg-orange-600" />A good project starts with the right people</p>
            <h1 className="mt-6 text-5xl sm:text-6xl xl:text-7xl font-semibold tracking-[-0.055em] leading-[1.06]">Big ideas.<br />Local expertise.<br /><span className="text-orange-700">Let’s get it done.</span></h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-lg">From everyday repairs to your next business move. Tell us what you need, compare responses, and choose a professional on your terms.</p>
            <form onSubmit={start} className="mt-8 bg-white border border-black/10 rounded-2xl p-3 shadow-xl shadow-primary/5 space-y-3">
              <div className="grid sm:grid-cols-[1.2fr_1fr] gap-3">
                <div className="relative"><label htmlFor="home-service" className="block pl-3 pt-2 text-xs font-semibold">What do you need?</label><Search className="absolute left-3 bottom-3 size-4 text-muted-foreground" /><Input id="home-service" value={service} onChange={e=>setService(e.target.value)} maxLength={100} placeholder="Try house cleaning" className="pl-9 border-0 shadow-none focus-visible:ring-1" /></div>
                <div className="relative sm:border-l"><label htmlFor="home-location" className="block pl-3 pt-2 text-xs font-semibold">Where is your project?</label><MapPin className="absolute left-3 bottom-3 size-4 text-muted-foreground" /><Input id="home-location" value={location} onChange={e=>setLocation(e.target.value)} maxLength={120} placeholder="City or postal code" className="pl-9 border-0 shadow-none focus-visible:ring-1" /></div>
              </div><Button type="submit" className="w-full h-12 rounded-xl text-sm">Find my professional <ArrowRight className="ml-2 size-4" /></Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2"><Check className="size-4 text-orange-700" />Free to post a request. You decide who to hire.</p>
          </div>
          <div className="relative" aria-label="How FLEXS works: describe your project, compare quotes, choose a professional">
            <div className="absolute -inset-8 rounded-full border border-primary/10 rotate-12" />
            <div className="relative bg-primary rounded-[2rem] p-7 sm:p-10 text-white shadow-2xl shadow-primary/15">
              <div className="flex justify-between items-center"><span className="text-xs font-medium tracking-[0.15em] text-white/70 uppercase">From to-do to done</span><Sparkles className="size-5 text-orange-300" /></div>
              <div className="mt-10 mb-8 flex gap-3 items-center"><div className="size-16 rounded-2xl bg-white/10 grid place-items-center"><Hammer className="size-8 text-orange-300" /></div><div><p className="text-2xl font-semibold tracking-tight">Your next project</p><p className="mt-1 text-sm text-white/65">A clearer path forward.</p></div></div>
              {[{icon:ClipboardList,title:'Tell us what you need',detail:'Your project, your priorities.'},{icon:MessageSquare,title:'Compare the responses',detail:'Discuss details and review quotes.'},{icon:Check,title:'Choose your professional',detail:'Make the decision that works for you.'}].map(({icon:Icon,title,detail},i)=><div key={title} className="flex gap-4 py-5 border-t border-white/15"><div className="size-10 rounded-full bg-white/10 shrink-0 grid place-items-center"><Icon className="size-5" /></div><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-white/65 mt-1.5">{detail}</p></div><span className="ml-auto text-xs text-white/40">0{i+1}</span></div>)}
              <div className="mt-5 rounded-xl bg-white/10 p-4 flex gap-3 items-center"><ShieldCheck className="size-5 text-orange-300 shrink-0" /><p className="text-xs leading-relaxed text-white/80">Keep your requests, quotes, and conversations together in one place.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8"><div><p className="text-xs text-orange-700 font-semibold uppercase tracking-[0.18em]">Find your expertise</p><h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">What’s on your list?</h2></div><Link to="/post-job" className="text-sm font-semibold flex items-center gap-2">Explore all services <ArrowRight className="size-4" /></Link></div>
        {categories.isLoading ? <p role="status">Loading services…</p> : categories.error ? <div role="alert" className="border rounded-2xl p-6"><p>Services could not be loaded.</p><Button variant="outline" onClick={()=>void categories.refetch()} className="mt-3">Retry services</Button></div> : services.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{services.map((category,i)=><Link to={`/services/${category.slug}`} key={category.id} className="group rounded-2xl border bg-card p-5 sm:p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"><div className={`size-12 rounded-xl grid place-items-center text-2xl ${i%2 ? 'bg-orange-50' : 'bg-primary/5'}`}>{category.icon || <Hammer className="size-6" />}</div><h3 className="mt-6 text-base font-semibold">{category.name}</h3><p className="text-xs mt-2 text-muted-foreground flex items-center justify-between">Explore this service<ArrowUpRight className="size-4 text-primary group-hover:translate-x-0.5 transition-transform" /></p></Link>)}</div> : <p className="text-muted-foreground">Service listings are being updated. Visit the service finder to check availability.</p>}
      </section>
      <section className="bg-[#f6f4ef] border-y"><div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid lg:grid-cols-[.8fr_1.2fr] gap-10 lg:gap-20"><div><p className="text-xs text-orange-700 font-semibold uppercase tracking-[0.18em]">Simple by design</p><h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">Less searching.<br />More moving forward.</h2><Link to="/post-job" className="inline-flex mt-6 text-sm font-semibold items-center gap-2">Start your request <ArrowRight className="size-4" /></Link></div><div className="grid sm:grid-cols-3 gap-6">{[['01','Describe your project','Answer a few questions so professionals can understand the job.'],['02','Have the conversation','Review profiles, ask questions, and compare quotes in your account.'],['03','Make your choice','Accept the quote that fits. Agree the work and payment directly with your professional.']].map(([n,title,detail])=><div key={n}><p className="text-3xl font-light text-orange-700 mb-5">{n}</p><h3 className="font-semibold mb-3">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{detail}</p></div>)}</div></div></section>
      {!!reviews.data?.length && <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16"><p className="text-xs text-orange-700 font-semibold uppercase tracking-[0.18em]">From FLEXS customers</p><h2 className="text-3xl font-semibold tracking-tight mt-3 mb-8">Their experience, in their words.</h2><div className="grid md:grid-cols-3 gap-5">{reviews.data.map(review=><article key={review.id} className="border rounded-2xl p-6"><p aria-label={`${review.rating} out of 5 stars`} className="flex gap-1 text-orange-700">{Array.from({length:review.rating},(_,i)=><Star key={i} className="size-4 fill-current" />)}</p><p className="mt-5 text-sm leading-relaxed">{review.review_text || 'This customer left a rating.'}</p><p className="mt-6 text-sm font-semibold">{review.reviewer_name || 'FLEXS customer'}</p><p className="text-xs mt-1 text-muted-foreground">Verified customer relationship</p></article>)}</div></section>}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16"><div className="rounded-[2rem] bg-primary text-white p-8 sm:p-12 flex flex-wrap justify-between items-center gap-8"><div><p className="text-xs text-orange-300 font-semibold uppercase tracking-[0.18em]">For independent professionals</p><h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-4">You do great work.<br />Let’s find your next project.</h2><p className="text-sm text-white/70 mt-5 max-w-lg leading-relaxed">Explore customer requests, choose which contacts to unlock, and manage your quotes and follow-ups in your own workspace.</p></div><Button asChild className="bg-white text-primary hover:bg-white/90 h-12 rounded-full px-6"><Link to="/pro">Explore FLEXS for pros <ArrowUpRight className="size-4 ml-2" /></Link></Button></div></section>
    </main>
    <footer className="border-t"><div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 grid sm:grid-cols-3 gap-8"><div><Link to="/" className="text-2xl font-extrabold tracking-tight">FLEXS<span className="text-orange-600">.</span></Link><p className="text-sm text-muted-foreground mt-3 max-w-xs">Local projects. Independent professionals. A place to move forward.</p></div><nav aria-label="Customer resources" className="grid gap-3 text-sm"><p className="font-semibold">Your project</p><Link to="/post-job">Find a Pro</Link><Link to="/my-requests">My requests</Link><Link to="/help">Help centre</Link><Link to="/support">Contact support</Link></nav><nav aria-label="Business resources" className="grid gap-3 text-sm"><p className="font-semibold">Your business</p><Link to="/pro">For professionals</Link><Link to="/app/dashboard">Professional workspace</Link><Link to="/about">About FLEXS</Link><a href="https://takatak.ca/services/lead-generation" target="_blank" rel="noopener noreferrer">Explore TakaTak services <ArrowUpRight className="inline size-3" /></a></nav></div><div className="border-t max-w-7xl mx-auto px-5 lg:px-8 py-5 flex flex-wrap gap-3 justify-between text-xs text-muted-foreground"><p>© {new Date().getFullYear()} FLEXS. An independent marketplace.</p><div className="flex gap-5"><Link to="/help/privacy">Privacy and data requests</Link><Link to="/cookies">Cookies</Link></div></div></footer>
  </div>;
}
