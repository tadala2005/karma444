import {OrderStatus} from '@/components/order-status';
export const dynamic='force-dynamic';export const metadata={title:'Order Status'};
export default async function Page({searchParams}:{searchParams:Promise<{ref?:string}>}){const {ref}=await searchParams;return <OrderStatus reference={ref||''}/>}
