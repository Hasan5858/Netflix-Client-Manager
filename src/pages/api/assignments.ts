import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json() as any;
        const {
            clientId,
            serviceId,
            masterEmailId,
            profileName,
            pin,
            expiresAt,
            credentialEmail,
            credentialPassword
        } = body;

        // Basic Validation
        if (!clientId || !serviceId || !expiresAt) {
            return new Response('Missing required fields (clientId, serviceId, expiry)', { status: 400 });
        }

        // Netflix Specific Validation
        if (serviceId === 'netflix') {
            if (!masterEmailId || !profileName || !pin) {
                return new Response('Netflix requires Master Email, Profile Name, and PIN', { status: 400 });
            }
        } else if (serviceId === 'prime') {
            // Prime uses Master Email and Profile Name, but NO PIN
            if (!masterEmailId || !profileName) {
                return new Response('Amazon Prime requires Master Email and Profile Name', { status: 400 });
            }
        } else if (serviceId === 'chatgpt' || serviceId === 'hoichoi') {
            // ChatGPT and Hoichoi use Master Email only, no Profile/PIN
            if (!masterEmailId) {
                return new Response('Service requires Master Email', { status: 400 });
            }
        } else {
            // Other services (HBO, etc) - Validation for Credential Login
            if (!credentialEmail || !credentialPassword) {
                return new Response('Service requires Email and Password', { status: 400 });
            }
        }

        const { success, error } = await locals.runtime.env.DB.prepare(
            `INSERT INTO client_services 
      (client_id, service_id, master_email_id, profile_name, pin, expires_at, credential_email, credential_password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            clientId,
            serviceId,
            masterEmailId ? Number(masterEmailId) : null,
            profileName || null,
            pin || null,
            expiresAt,
            credentialEmail || null,
            credentialPassword || null
        ).run();

        if (!success) {
            console.error('DB Insert Error:', error);
            throw new Error(error || 'Failed to insert');
        }

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
        console.error('Assignment POST Error:', e);
        return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
    }
};

export const PUT: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json() as any;
        const {
            id,
            serviceId,
            masterEmailId,
            profileName,
            pin,
            expiresAt,
            credentialEmail,
            credentialPassword
        } = body;

        if (!id || !serviceId || !expiresAt) {
            return new Response('Missing required fields (id, serviceId, expiry)', { status: 400 });
        }

        const { success, error } = await locals.runtime.env.DB.prepare(
            `UPDATE client_services 
             SET service_id = ?, master_email_id = ?, profile_name = ?, pin = ?, expires_at = ?, credential_email = ?, credential_password = ?
             WHERE id = ?`
        ).bind(
            serviceId,
            masterEmailId ? Number(masterEmailId) : null,
            profileName || null,
            pin || null,
            expiresAt,
            credentialEmail || null,
            credentialPassword || null,
            id
        ).run();

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

export const GET: APIRoute = async ({ request, locals }) => {
    // Get assignments for a client
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    if (!clientId) return new Response("Client ID required", { status: 400 });

    try {
        const { results } = await locals.runtime.env.DB.prepare(
            `SELECT cs.*, 
                    s.name as service_name, 
                    m.email_address as master_email,
                    m.password as master_password
             FROM client_services cs
             JOIN services s ON cs.service_id = s.id
             LEFT JOIN master_emails m ON cs.master_email_id = m.id
             WHERE cs.client_id = ?`
        ).bind(clientId).all();

        return new Response(JSON.stringify(results), {
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

export const DELETE: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response("ID required", { status: 400 });

    try {
        await locals.runtime.env.DB.prepare('DELETE FROM client_services WHERE id = ?').bind(id).run();
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
