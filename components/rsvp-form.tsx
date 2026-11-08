'use client';
import {useState} from 'react';
import {Check,ArrowRight} from 'lucide-react';
export function RsvpForm({eventId}:{eventId:string}){
 const [form,setForm]=useState({name:'',email:''}),[state,setState]=useState<'idle'|'busy'|'done'>('idle'),[error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setState('busy');setError('');try{const res=await fetch('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId,...form})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to RSVP');setState('done');}catch(e:any){setError(e.message);setState('idle');}}
 if(state==='done')return <div className="success-panel"><Check size={24}/><h3>YOU'RE ON THE LIST.</h3><p>RSVP confirmed for {form.email}. Save your details for the door.</p></div>;
 return <form className="rsvp-form" onSubmit={submit}><p className="eyebrow">FREE EVENT · LIMITED SPACE</p><h3>YOUR NAME ON THE LIST.</h3><label>FULL NAME<input value={form.name} minLength={2} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Your name"/></label><label>EMAIL ADDRESS<input value={form.email} type="email" onChange={e=>setForm({...form,email:e.target.value})} required placeholder="you@example.com"/></label>{error&&<p className="error-msg">{error}</p>}<button className="btn orange fill" disabled={state==='busy'}>{state==='busy'?'RESERVING...':'SAVE MY SPOT'} <ArrowRight size={18}/></button></form>
}
