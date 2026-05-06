import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    try {
        const { results } = await locals.runtime.env.DB.prepare(
            `SELECT m.*, COUNT(cs.id) as client_count 
             FROM master_emails m 
             LEFT JOIN client_services cs ON m.id = cs.master_email_id 
             GROUP BY m.id
             ORDER BY m.id DESC`
        ).all();
        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { email, password, serviceType } = await request.json() as { email: string; password?: string; serviceType?: string };
        if (!email || !password) return new Response('Email and Password required', { status: 400 });

        const type = serviceType || 'netflix';
        const { success, error } = await locals.runtime.env.DB.prepare(
            'INSERT INTO master_emails (email_address, password, service_type) VALUES (?, ?, ?)'
        ).bind(email, password, type).run();

        if (!success) throw new Error(error || 'Failed to insert');

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
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
};

export const PUT: APIRoute = async ({ request, locals }) => {
    try {
        const { id, email, password } = await request.json() as { id: number; email: string; password: string };
        if (!id || !email || !password) return new Response('ID, Email and Password required', { status: 400 });

        const { success, error } = await locals.runtime.env.DB.prepare(
            'UPDATE master_emails SET email_address = ?, password = ? WHERE id = ?'
        ).bind(email, password, id).run();

        if (!success) throw new Error(error || 'Failed to update');

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
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return new Response("ID required", { status: 400 });

        // 1. Delete associated client services first (Cascade)
        await locals.runtime.env.DB.prepare(
            'DELETE FROM client_services WHERE master_email_id = ?'
        ).bind(id).run();

        // 2. Delete the master email
        const { success, error } = await locals.runtime.env.DB.prepare(
            'DELETE FROM master_emails WHERE id = ?'
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
