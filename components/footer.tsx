import Link from 'next/link';
import {ArrowUpRight,Instagram} from 'lucide-react';
export function Footer(){return <footer className="footer"><div className="footer-inner">
 <div className="footer-top"><div><p className="eyebrow light">THE CULTURE DOESN'T WAIT</p><h2>GOOD THINGS<br/>COME <i>AROUND.</i></h2></div><Link className="round-link" href="/studio" aria-label="Work with Karma"><ArrowUpRight size={40}/></Link></div>
 <div className="footer-info"><div><Link className="footer-logo" href="/">KARMA<span>.</span></Link><p>What You Deserve.<br/>Music. Style. People. Malawi.</p></div><div><h4>EXPLORE</h4><Link href="/artists">Artists</Link><Link href="/culture">Culture</Link><Link href="/events">Events</Link><Link href="/shop">Merch</Link></div><div><h4>KARMA</h4><Link href="/studio">Work with us</Link><Link href="/account">My account</Link><Link href="/cart">Your bag</Link></div><div><h4>FOLLOW THE MOVEMENT</h4><p>Made for a generation<br/>building its own culture.</p><Instagram size={21}/></div></div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()} KARMA. ALL RIGHTS RESERVED.</span><span>BUILT IN MALAWI. MADE FOR EVERYWHERE.</span><span>WHAT YOU DESERVE ™</span></div>
 </div></footer>}
