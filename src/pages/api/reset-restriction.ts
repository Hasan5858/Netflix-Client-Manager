import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    // Check admin authentication
    const adminToken = cookies.get('admin_token')?.value;
    if (adminToken !== locals.runtime.env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { clientServiceId } = await request.json();

    if (!clientServiceId) {
        return new Response(JSON.stringify({ error: 'clientServiceId required' }), { status: 400 });
    }

    try {
        // Reset last_checked_at to NULL to remove the 7-day restriction
        await locals.runtime.env.DB.prepare(
            `UPDATE client_services SET last_checked_at = NULL WHERE id = ?`
        ).bind(clientServiceId).run();

        return new Response(JSON.stringify({ success: true, message: 'Restriction reset successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('Reset restriction error:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
