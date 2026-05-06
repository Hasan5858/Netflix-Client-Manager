import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    try {
        // Return clients with their service count
        const { results } = await locals.runtime.env.DB.prepare(
            `SELECT c.*, COUNT(cs.id) as service_count 
       FROM clients c
       LEFT JOIN client_services cs ON c.id = cs.client_id
       GROUP BY c.id
       ORDER BY c.id DESC`
        ).all();
        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { name } = await request.json() as { name: string };
        if (!name) return new Response('Name required', { status: 400 });

        // Generate random API Key
        const apiKey = 'key_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const { success, error } = await locals.runtime.env.DB.prepare(
            'INSERT INTO clients (name, api_key) VALUES (?, ?)'
        ).bind(name, apiKey).run();

        if (!success) throw new Error(error || 'Failed to insert');

        return new Response(JSON.stringify({ success: true, apiKey }), {
            status: 201,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return new Response("ID required", { status: 400 });

        const { success, error } = await locals.runtime.env.DB.prepare(
            'DELETE FROM clients WHERE id = ?'
        ).bind(id).run();

        if (!success) throw new Error(error || 'Failed to delete');

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
    }
}
