'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
export function AdminOrderAction({id,status}:{id:string,status:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const next:Record<string,string>={PAID:'PROCESSING',PROCESSING:'SHIPPED',SHIPPED:'DELIVERED'};
 if(!next[status])return <span>{status}</span>;
 return <span><button className="minor-button" disabled={busy} onClick={async()=>{setBusy(true);const r=await fetch(`/api/admin/orders/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next[status]})});if(!r.ok)setError((await r.json()).error);else router.refresh();setBusy(false)}}>{busy?'UPDATING...':`MARK ${next[status]}`}</button>{error&&<small className="red-action">{error}</small>}</span>
}
export function AdminBookingAction({id,status}:{id:string,status:string}){
 const router=useRouter();return <select value={status} aria-label="Booking status" onChange={async e=>{const r=await fetch(`/api/admin/bookings/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:e.target.value})});if(r.ok)router.refresh()}}><option>NEW</option><option>CONTACTED</option><option>CLOSED</option></select>
}
