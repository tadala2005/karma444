'use client';
import {useState} from 'react';
import {ShoppingBag,Check,Minus,Plus} from 'lucide-react';
import {useCart} from './cart-store';
export function AddToCart({item,kind='PRODUCT',sizes=false}:{item:{id:string,slug:string,name?:string,title?:string,image:string,price:number,stock?:number,remaining?:number},kind?:'PRODUCT'|'TICKET',sizes?:boolean}){
 const [added,setAdded]=useState(false),[qty,setQty]=useState(1),[size,setSize]=useState('ONE SIZE');
 const add=useCart(s=>s.add);
 const available=kind==='PRODUCT' ? item.stock??0 : item.remaining??0;
 return <div className="purchase-actions">
  {sizes&&<div className="size-picker"><span>SIZE / FIT</span><div>{['ONE SIZE','S','M','L','XL'].map(s=><button key={s} onClick={()=>setSize(s)} className={size===s?'selected':''}>{s}</button>)}</div></div>}
  <div className="purchase-control"><div className="quantity-control"><button aria-label="Decrease" onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={16}/></button><span>{qty}</span><button aria-label="Increase" onClick={()=>setQty(Math.min(Math.min(10,available),qty+1))}><Plus size={16}/></button></div><button disabled={!available} className="btn dark grow" onClick={()=>{add({id:item.id,kind,slug:item.slug,title:item.name||item.title||'',image:item.image,unitPrice:item.price,quantity:qty,size:sizes?size:undefined});setAdded(true);setTimeout(()=>setAdded(false),1700)}}>{added?<><Check size={18}/> ADDED TO BAG</>:<><ShoppingBag size={18}/> {available?'ADD TO BAG':'SOLD OUT'}</>}</button></div>
  <p className="subtle">{available>0 ? `${available} available · Secure PayChangu checkout` : 'Currently unavailable'}</p>
 </div>
}
