// Simple instance-local throttle for starter deployments. Replace with a shared Redis limiter at scale.
const hits = new Map<string,{count:number,reset:number}>();
export function allowRequest(ip: string, group: string, max=10, windowMs=60000) {
  const key = `${group}:${ip}`;
  const now=Date.now();
  if (hits.size > 20000) hits.clear();
  const h=hits.get(key);
  if (!h || h.reset<now) { hits.set(key,{count:1,reset:now+windowMs}); return true; }
  if (h.count>=max) return false;
  h.count++;
  return true;
}
export function requestIp(req: Request) { return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'; }
