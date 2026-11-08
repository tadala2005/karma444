import {artists} from '@/lib/catalog';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
export const dynamic='force-dynamic';
export const metadata={title:'Artists'};
export default async function Page(){const data=await artists();return <main><section className="page-banner dark-banner"><div className="main-container"><p className="eyebrow light">KARMA / THE ROSTER</p><h1>THE PEOPLE<br/><em>BEHIND THE SOUND.</em></h1><p>Independent voices. Unfiltered expression. Discover the artists moving culture forward.</p></div></section><div className="main-container section-block"><div className="subheading-row"><span>ARTIST DIRECTORY</span><span>{String(data.length).padStart(2,'0')} PROFILES</span></div><div className="artist-grid expanded">{data.map((a,i)=><Link href={`/artists/${a.slug}`} className="artist-card" key={a.slug}><img alt={a.name} src={a.image}/><div className="artist-overlay"><span className="artist-number">{String(i+1).padStart(2,'0')} / {a.city.toUpperCase()}</span><div><h3>{a.name}</h3><p>{a.genre.toUpperCase()}</p></div><ArrowUpRight size={25}/></div></Link>)}</div></div></main>}
