'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,LockKeyhole,ShieldCheck} from 'lucide-react';
import {useCart} from './cart-store';
import {money} from '@/lib/format';
export function CheckoutForm(){
 const items=useCart(s=>s.items);
 const [mounted,setMounted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [form,setForm]=useState({name:'',email:'',phone:'',address:'',city:'Blantyre'});
 useEffect(()=>setMounted(true),[]);
 const total=items.reduce((s,x)=>s+x.unitPrice*x.quantity,0);
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer:form,items:items.map(x=>({kind:x.kind,id:x.id,quantity:x.quantity,size:x.size}))})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Checkout failed');
   window.location.assign(data.checkoutUrl);
  }catch(e:any){setError(e.message);setBusy(false);}
 }
 if(!mounted)return <div className="main-container page-pad"><h1 className="page-title">CHECKOUT.</h1></div>;
 if(!items.length)return <div className="main-container empty-state"><h1>YOUR BAG IS EMPTY.</h1><Link href="/shop" className="btn dark">BACK TO SHOP</Link></div>;
 return <main className="main-container page-pad"><p className="eyebrow">CHECKOUT / SECURE PAYMENT</p><h1 className="page-title">MAKE IT YOURS<span className="accent-dot">.</span></h1><div className="cart-layout"><form onSubmit={submit} className="checkout-form"><h2>01 / YOUR DETAILS</h2><div className="form-grid"><label>FULL NAME<input required value={form.name} minLength={2} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>EMAIL ADDRESS<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>PHONE NUMBER<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+265 88..."/></label><label>CITY<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Blantyre"/></label><label className="span-two">DELIVERY ADDRESS (REQUIRED FOR MERCH)<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Area, street or collection instructions" rows={3}/></label></div>
  <h2 className="payment-heading">02 / PAYMENT</h2><div className="payment-method"><div className="payment-icon">P</div><div><b>PAYCHANGU SECURE CHECKOUT</b><p>Pay with supported mobile money or cards on PayChangu’s secure payment page.</p></div><ShieldCheck size={22}/></div>
  {error&&<p className="error-msg" role="alert">{error}</p>}
  <button className="btn orange fill" disabled={busy}>{busy?'CREATING YOUR PAYMENT...':<>PROCEED TO PAYCHANGU <ArrowRight size={18}/></>}</button><p className="subtle"><LockKeyhole size={13}/> Order confirmed only after successful payment verification.</p>
  </form><aside className="checkout-summary"><p className="eyebrow">YOUR ORDER</p><h2>THE DETAILS.</h2>{items.map(x=><div className="summary-row" key={`${x.kind}-${x.id}-${x.size||''}`}><span>{x.title} × {x.quantity}</span><b>{money(x.unitPrice*x.quantity)}</b></div>)}<div className="summary-total"><span>YOU PAY</span><b>{money(total)}</b></div><Link href="/cart" className="plain-back">EDIT BAG</Link></aside></div></main>
}
