import type {Metadata,Viewport} from 'next';
import './globals.css';
import {Header} from '@/components/header';
import {Footer} from '@/components/footer';
import {Pwa} from '@/components/pwa';
export const metadata:Metadata={title:{default:'KARMA — What You Deserve',template:'%s | KARMA'},description:'An independent platform for music, culture, streetwear and experiences from Malawi.',applicationName:'Karma',manifest:'/manifest.webmanifest',openGraph:{title:'KARMA — What You Deserve',description:'Music. Style. People. Malawi.',type:'website'}};
export const viewport:Viewport={themeColor:'#101010',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Pwa/><Header/>{!process.env.DATABASE_URL&&<div className="demo-banner" role="status">PREVIEW MODE · SAMPLE CONTENT ONLY · LIVE ORDERS REQUIRE DATABASE & PAYCHANGU</div>}{children}<Footer/></body></html>}
