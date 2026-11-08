'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export type CartItem = {kind:'PRODUCT'|'TICKET',id:string,slug:string,title:string,image:string,unitPrice:number,quantity:number,size?:string};
type Store={items:CartItem[],add:(item:CartItem)=>void,remove:(id:string,kind:CartItem['kind'],size?:string)=>void,quantity:(id:string,kind:CartItem['kind'],size:string|undefined,n:number)=>void,clear:()=>void};
export const useCart=create<Store>()(persist((set)=>({
 items:[],
 add:(item)=>set(state=>{
   const index=state.items.findIndex(x=>x.id===item.id && x.kind===item.kind && x.size===item.size);
   if(index<0)return {items:[...state.items,item]};
   return {items:state.items.map((x,i)=>i===index?{...x,quantity:Math.min(10,x.quantity+item.quantity)}:x)};
 }),
 remove:(id,kind,size)=>set(s=>({items:s.items.filter(x=>!(x.id===id && x.kind===kind && x.size===size))})),
 quantity:(id,kind,size,n)=>set(s=>({items:s.items.map(x=>(x.id===id && x.kind===kind && x.size===size)?{...x,quantity:Math.max(1,Math.min(10,n))}:x)})),
 clear:()=>set({items:[]})
}),{name:'karma-cart-v1'}));
