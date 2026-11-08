'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {Plus,Trash2,Save,ArrowUpRight} from 'lucide-react';
import {slugify} from '@/lib/format';

type Field={name:string,label:string,type?:'text'|'number'|'textarea'|'date'|'url'|'checkbox',required?:boolean};
const definitions: Record<string,Field[]>={
 products:[{name:'name',label:'Product name',required:true},{name:'slug',label:'URL slug',required:true},{name:'description',label:'Description',type:'textarea',required:true},{name:'image',label:'HTTPS image URL',type:'url',required:true},{name:'category',label:'Category',required:true},{name:'price',label:'Price in MK',type:'number',required:true},{name:'stock',label:'Stock available',type:'number',required:true},{name:'featured',label:'Featured',type:'checkbox'}],
 artists:[{name:'name',label:'Artist name',required:true},{name:'slug',label:'URL slug',required:true},{name:'bio',label:'Artist biography',type:'textarea',required:true},{name:'image',label:'HTTPS image URL',type:'url',required:true},{name:'genre',label:'Genre',required:true},{name:'city',label:'City',required:true},{name:'instagram',label:'Instagram URL',type:'url'},{name:'spotify',label:'Music link URL',type:'url'},{name:'featured',label:'Featured',type:'checkbox'}],
 articles:[{name:'title',label:'Story title',required:true},{name:'slug',label:'URL slug',required:true},{name:'excerpt',label:'Summary',type:'textarea',required:true},{name:'body',label:'Article body',type:'textarea',required:true},{name:'image',label:'HTTPS image URL',type:'url',required:true},{name:'category',label:'Category',required:true},{name:'author',label:'Author name',required:true},{name:'featured',label:'Featured',type:'checkbox'}],
 events:[{name:'title',label:'Event title',required:true},{name:'slug',label:'URL slug',required:true},{name:'summary',label:'Event description',type:'textarea',required:true},{name:'image',label:'HTTPS image URL',type:'url',required:true},{name:'venue',label:'Venue',required:true},{name:'city',label:'City',required:true},{name:'date',label:'Event date & time (your local time)',type:'date',required:true},{name:'price',label:'Ticket price in MK (0 = free RSVP)',type:'number',required:true},{name:'capacity',label:'Total capacity',type:'number',required:true},{name:'featured',label:'Featured',type:'checkbox'}]
};
const paths:Record<string,string>={products:'/shop/',artists:'/artists/',articles:'/culture/',events:'/events/'};
type RecordItem={id:string,slug:string,title?:string,name?:string};
type AdminPanelProps={data:Record<string,RecordItem[]>};
export function AdminPanel({data}:AdminPanelProps){
 const router=useRouter(),[tab,setTab]=useState('products'),[fields,setFields]=useState<Record<string,string|boolean>>({featured:false}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[editing,setEditing]=useState<string|null>(null);
 function switchTab(t:string){setTab(t);setFields({featured:false});setEditing(null);setError('');setMessage('')}
 const titleKey=tab==='articles'||tab==='events'?'title':'name';
 function setField(name:string,value:string|boolean){setFields(s=>({...s,[name]:value,...((name===titleKey && !editing)?{slug:slugify(String(value))}:{})}));}
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{
  const payload:any={...fields};for(const f of definitions[tab]){if(f.type==='number')payload[f.name]=Number(fields[f.name]||0);if(f.type==='checkbox')payload[f.name]=Boolean(fields[f.name]);}
  if(tab==='events'&&fields.date)payload.date=new Date(String(fields.date)).toISOString();
  const url=editing?`/api/admin/${tab}/${editing}`:`/api/admin/${tab}`;
  const res=await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const body=await res.json();if(!res.ok)throw new Error(body.error||'Unable to save');
  setMessage(editing?'Entry updated.':'New entry published.');setFields({featured:false});setEditing(null);router.refresh();
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function remove(item:RecordItem){if(!confirm(`Delete ${item.name||item.title}? This cannot be undone.`))return;setError('');try{const res=await fetch(`/api/admin/${tab}/${item.id}`,{method:'DELETE'});if(!res.ok)throw new Error((await res.json()).error);router.refresh()}catch(e:any){setError(e.message)}}
 function startEdit(item:any){setEditing(item.id);const next:any={};for(const f of definitions[tab]){if(f.name==='date')next.date=item.date?new Date(item.date).toISOString().slice(0,16):'';else next[f.name]=item[f.name]??(f.type==='checkbox'?false:'');}setFields(next);window.scrollTo({top:0,behavior:'smooth'});}
 return <div className="admin-content"><div className="admin-tabs">{Object.keys(definitions).map(k=><button key={k} className={tab===k?'selected':''} onClick={()=>switchTab(k)}>{k.toUpperCase()} <span>{data[k]?.length||0}</span></button>)}</div>
 <div className="admin-cols"><div className="admin-form"><p className="eyebrow">{editing?'EDIT EXISTING':'PUBLISH NEW'} / {tab.toUpperCase()}</p><h3>{editing?'EDIT ENTRY':'CREATE CONTENT.'}</h3><form onSubmit={submit} className="admin-fields">{definitions[tab].map(f=><label key={f.name}>{f.label.toUpperCase()}{f.type==='checkbox'?<input type="checkbox" checked={Boolean(fields[f.name])} onChange={e=>setField(f.name,e.target.checked)}/>:f.type==='textarea'?<textarea rows={f.name==='body'?8:3} required={f.required} value={String(fields[f.name]??'')} onChange={e=>setField(f.name,e.target.value)}/>:<input type={f.type==='date'?'datetime-local':f.type||'text'} required={f.required} min={f.type==='number'?0:undefined} value={String(fields[f.name]??'')} onChange={e=>setField(f.name,e.target.value)}/>}</label>)}{error&&<p className="error-msg">{error}</p>}{message&&<p className="success-msg">{message}</p>}<button disabled={busy} className="btn orange fill">{editing?<Save size={16}/>:<Plus size={16}/>} {busy?'SAVING...':editing?'SAVE CHANGES':'PUBLISH ENTRY'}</button>{editing&&<button type="button" className="btn outline" onClick={()=>{setEditing(null);setFields({featured:false})}}>CANCEL EDIT</button>}</form></div>
 <div className="admin-list"><p className="eyebrow">PUBLISHED CONTENT</p><h3>MANAGE {tab.toUpperCase()}.</h3>{data[tab]?.length?data[tab].map((item:any)=><div className="admin-list-row" key={item.id}><div><b>{item.title||item.name}</b><span>{item.slug}</span></div><div><a href={`${paths[tab]}${item.slug}`} title="View public page" target="_blank" rel="noreferrer"><ArrowUpRight size={17}/></a><button onClick={()=>startEdit(item)} title="Edit">EDIT</button><button className="red-action" title="Delete" onClick={()=>remove(item)}><Trash2 size={16}/></button></div></div>):<p>No entries yet.</p>}</div></div></div>
}
