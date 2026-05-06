import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
    cookies.delete('client_api_key', { path: '/' });
    return redirect('/login');
};
