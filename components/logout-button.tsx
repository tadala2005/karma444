'use client';
import {useRouter} from 'next/navigation';
export function LogoutButton(){const router=useRouter();return <button className="btn outline" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/');router.refresh()}}>SIGN OUT</button>}
