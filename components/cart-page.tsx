'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Trash2,ArrowRight,ArrowLeft,Minus,Plus} from 'lucide-react';
import {useCart} from './cart-store';
import {money} from '@/lib/format';
export function CartPage(){
 const {items,remove,quantity}=useCart();
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const total=items.reduce((s,x)=>s+x.unitPrice*x.quantity,0);
 if(!mounted) return <div className="main-container"><h1 className="page-title">YOUR BAG</h1></div>;
 if(!items.length) return <div className="main-container empty-state"><p className="eyebrow">NOTHING IN HERE YET</p><h1>THE BAG IS<br/>WAITING.</h1><p>Find a new piece or an event worth showing up for.</p><Link href="/shop" className="btn dark">EXPLORE THE DROP <ArrowRight size={17}/></Link></div>;
 return <main className="main-container page-pad"><p className="eyebrow">YOUR SELECTION / {items.length} ITEMS</p><h1 className="page-title">YOUR BAG<span className="accent-dot">.</span></h1>
  <div className="cart-layout"><div className="cart-items">{items.map(item=><div className="cart-item" key={`${item.kind}-${item.id}-${item.size||''}`}><img src={item.image} alt={item.title}/><div className="cart-item-info"><span className="eyebrow">{item.kind==='TICKET'?'EVENT TICKET':'KARMA MERCH'}</span><h3>{item.title}</h3>{item.size&&<small>SIZE: {item.size}</small>}<b>{money(item.unitPrice)}</b><div className="inline-qty"><button aria-label="Less" onClick={()=>quantity(item.id,item.kind,item.size,item.quantity-1)}><Minus size={14}/></button><span>{item.quantity}</span><button aria-label="More" onClick={()=>quantity(item.id,item.kind,item.size,item.quantity+1)}><Plus size={14}/></button></div></div><button className="remove-item" aria-label="Remove item" onClick={()=>remove(item.id,item.kind,item.size)}><Trash2 size={18}/></button></div>)}<Link href="/shop" className="plain-back"><ArrowLeft size={16}/> CONTINUE SHOPPING</Link></div>
  <aside className="checkout-summary"><p className="eyebrow">CHECKOUT SUMMARY</p><h2>THE TOTAL.</h2><div className="summary-row"><span>Subtotal</span><b>{money(total)}</b></div><div className="summary-row"><span>Delivery</span><span>Arranged after purchase</span></div><div className="summary-total"><span>TOTAL</span><b>{money(total)}</b></div><Link className="btn orange fill" href="/checkout">CONTINUE TO PAYMENT <ArrowRight size={18}/></Link><p className="subtle center">Payments secured by PayChangu</p></aside></div>
 </main>
}
