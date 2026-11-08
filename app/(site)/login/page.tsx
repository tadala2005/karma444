import {AuthForm} from '@/components/auth-form';import {Suspense} from 'react';
export const metadata={title:'Sign In'};
export default function Page(){return <Suspense fallback={<main className="main-container page-pad"><h1>SIGN IN.</h1></main>}><AuthForm mode="login"/></Suspense>}
