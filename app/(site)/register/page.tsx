import {AuthForm} from '@/components/auth-form';import {Suspense} from 'react';
export const metadata={title:'Join Karma'};
export default function Page(){return <Suspense fallback={<main className="main-container page-pad"><h1>JOIN KARMA.</h1></main>}><AuthForm mode="register"/></Suspense>}
