import { z } from 'zod';
export const email = z.string().trim().email().max(180).toLowerCase();
export const registerSchema = z.object({name:z.string().trim().min(2).max(100), email, password:z.string().min(10).max(128)});
export const loginSchema = z.object({email, password:z.string().min(1)});
export const customerSchema = z.object({name:z.string().trim().min(2).max(120), email, phone:z.string().trim().min(7).max(24), address:z.string().trim().max(250).default(''), city:z.string().trim().max(80).default('')});
export const checkoutSchema=z.object({customer:customerSchema, items:z.array(z.object({kind:z.enum(['PRODUCT','TICKET']), id:z.string().min(1), quantity:z.number().int().min(1).max(10), size:z.string().max(12).optional()})).min(1).max(25)});
export const rsvpSchema=z.object({eventId:z.string().min(1),name:z.string().trim().min(2).max(100),email});
export const bookingSchema=z.object({name:z.string().trim().min(2).max(100),email,service:z.string().min(2).max(100),budget:z.string().max(100).optional(),brief:z.string().trim().min(15).max(4000)});
export const imageUrl=z.string().url().refine(v=>v.startsWith('https://'), 'Use an HTTPS image URL');
export const artistSchema=z.object({name:z.string().min(2).max(100),slug:z.string().regex(/^[a-z0-9-]+$/),bio:z.string().min(20),genre:z.string().max(100),city:z.string().max(100),image:imageUrl,instagram:z.string().url().refine(v=>v.startsWith('https://'),'HTTPS URL required').optional().or(z.literal('')),spotify:z.string().url().refine(v=>v.startsWith('https://'),'HTTPS URL required').optional().or(z.literal('')),featured:z.boolean().default(false)});
export const articleSchema=z.object({title:z.string().min(5).max(180),slug:z.string().regex(/^[a-z0-9-]+$/),excerpt:z.string().min(15).max(400),body:z.string().min(50),image:imageUrl,category:z.string().max(80),author:z.string().max(100),featured:z.boolean().default(false)});
export const eventSchema=z.object({title:z.string().min(5).max(160),slug:z.string().regex(/^[a-z0-9-]+$/),summary:z.string().min(20),image:imageUrl,venue:z.string().min(2),city:z.string().min(2),date:z.string().datetime(),price:z.number().int().min(0).max(50000000),capacity:z.number().int().min(1).max(100000),featured:z.boolean().default(false)});
export const productSchema=z.object({name:z.string().min(3).max(120),slug:z.string().regex(/^[a-z0-9-]+$/),description:z.string().min(15),image:imageUrl,category:z.string().min(2),price:z.number().int().min(1).max(50000000),stock:z.number().int().min(0).max(100000),featured:z.boolean().default(false)});
export function errorMessage(e:unknown) { return e instanceof z.ZodError ? e.errors.map(v=>`${v.path.join('.')}: ${v.message}`).join('; ') : 'Request could not be completed'; }
