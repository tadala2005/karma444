'use client';
import {useMemo,useState} from 'react';
import {Search} from 'lucide-react';
import {ProductCard} from './ui';
export function ShopGrid({products}:{products:{id:string,slug:string,name:string,image:string,price:number,stock:number,category:string,description:string}[]}){
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('ALL');
 const categories=['ALL',...new Set(products.map(x=>x.category.toUpperCase()))];
 const visible=useMemo(()=>products.filter(p=>(filter==='ALL'||p.category.toUpperCase()===filter)&&(p.name+' '+p.description).toLowerCase().includes(search.toLowerCase())),[products,filter,search]);
 return <><div className="filters"><div className="filter-tabs">{categories.map(x=><button key={x} onClick={()=>setFilter(x)} className={filter===x?'selected':''}>{x}</button>)}</div><label className="search-box"><Search size={17}/><input aria-label="Search merchandise" placeholder="SEARCH THE DROP" value={search} onChange={e=>setSearch(e.target.value)}/></label></div><div className="product-grid">{visible.map(p=><ProductCard key={p.slug} product={p}/>)}</div>{!visible.length&&<p className="no-results">Nothing matches yet. Try a different search.</p>}</>
}
