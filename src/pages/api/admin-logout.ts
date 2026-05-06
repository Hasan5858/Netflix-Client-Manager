import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {

    cookies.delete('admin_access_token', { path: '/' });
    return new Response(null, {
        status: 302,
        headers: {
            'Location': '/admin-login',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        }
    });
};
