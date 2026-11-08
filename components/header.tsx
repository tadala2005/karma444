'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ShoppingBag,Menu,X,ArrowUpRight,UserCircle2} from 'lucide-react';
import {useCart} from './cart-store';
import {useEffect,useState} from 'react';

const links=[['/artists','ARTISTS'],['/culture','CULTURE'],['/events','EVENTS'],['/shop','SHOP'],['/studio','STUDIO']];
export function Header(){
 const [open,setOpen]=useState(false),[mounted,setMounted]=useState(false);
 const pathname=usePathname();
 const items=useCart(s=>s.items);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>setOpen(false),[pathname]);
 const count=mounted?items.reduce((s,x)=>s+x.quantity,0):0;
 return <>
  <div className="topline"><span>INDEPENDENT CULTURE FROM MALAWI</span><span className="topline-right">MUSIC · STYLE · EVENTS · PEOPLE <span className="dot">●</span> WHAT YOU DESERVE</span></div>
  <header className="site-header"><div className="header-inner">
   <Link className="wordmark" href="/">KARMA<span className="brand-dot">.</span></Link>
   <nav className="desktop-nav" aria-label="Main navigation">{links.map(([url,title])=><Link key={url} className={pathname.startsWith(url)?'active':''} href={url}>{title}</Link>)}</nav>
   <div className="header-actions"><Link aria-label="Account" href="/account" className="icon-link"><UserCircle2 size={20}/></Link><Link className="bag-link" href="/cart"><ShoppingBag size={19}/><span className="bag-count">{count}</span></Link><button className="menu-btn" aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X size={23}/>:<Menu size={23}/>}</button></div>
  </div></header>
  {open&&<nav className="mobile-menu" aria-label="Mobile navigation">{links.map(([url,title])=><Link href={url} key={url}>{title}<ArrowUpRight size={20}/></Link>)}<Link href="/account">MY ACCOUNT<ArrowUpRight size={20}/></Link></nav>}
 </>;
}
