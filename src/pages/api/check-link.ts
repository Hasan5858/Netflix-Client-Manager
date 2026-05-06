import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const clientServiceId = url.searchParams.get('clientServiceId');

    if (!clientServiceId) {
        return new Response(JSON.stringify({ error: 'Service ID required' }), { status: 400 });
    }

    try {
        // Load client service + master account
        const { results } = await locals.runtime.env.DB.prepare(
            `SELECT m.email_address, m.api_provider, cs.expires_at, cs.service_id, cs.last_checked_at
             FROM client_services cs 
             JOIN master_emails m ON cs.master_email_id = m.id 
             WHERE cs.id = ?`
        ).bind(clientServiceId).all();

        const data = results[0] as any;

        if (!data) {
            return new Response(JSON.stringify({ error: 'Service not found or not linked' }), {
                status: 404,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Surrogate-Control': 'no-store'
                }
            });
        }

        if (new Date(data.expires_at) < new Date()) {
            return new Response(JSON.stringify({ error: 'Subscription expired', success: false }), { status: 403 });
        }

        // ChatGPT 7-Day Restriction (only enforced on check-link) 
        if (data.service_id === 'chatgpt' && data.last_checked_at) {
            const lastCheck = new Date(data.last_checked_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastCheck.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 7) {
                return new Response(JSON.stringify({
                    success: false,
                    restricted: true,
                    error: 'You can only view this code once every 7 days.'
                }), {
                    status: 403,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'Surrogate-Control': 'no-store'
                    }
                });
            }
        }

        let masterEmail = (data.email_address || '').trim();

        // Mine-specific forwarding rule (Example)
        if (data.service_id === 'netflix' && masterEmail.endsWith('@gmail.com')) {
            masterEmail = masterEmail.replace('@gmail.com', '@yourdomain.com');
        }

        // Mine API Logic (Unified)
        const authSecret = locals.runtime.env.AUTH_SECRET;
        if (!authSecret) {
            console.error('Missing AUTH_SECRET in environment variables');
            return new Response(JSON.stringify({ error: 'Server Configuration Error: AUTH_SECRET missing', success: false }), { status: 500 });
        }

        let response;
        const workerUrl = `${locals.runtime.env.WORKER_URL}?mail=${encodeURIComponent(masterEmail)}&secret=${authSecret}`;

        try {
            if (locals.runtime.env.HOUSEHOLD) {
                try { response = await locals.runtime.env.HOUSEHOLD.fetch(workerUrl); }
                catch (bindingErr: any) { console.log('Service binding failed, using public fetch:', bindingErr.message); response = await fetch(workerUrl); }
            } else {
                response = await fetch(workerUrl);
            }
        } catch (fetchErr: any) {
            console.error('Fetch Error:', fetchErr);
            return new Response(JSON.stringify({ error: `Fetch Failed: ${fetchErr.message || fetchErr}`, success: false }), { status: 500 });
        }

        if (!response.ok) {
            const errText = await response.text();
            return new Response(JSON.stringify({ error: `Worker API Error (${response.status}): ${errText}`, success: false }), { status: response.status });
        }

        const resJson = await response.json() as any;

        if (resJson.success && data.service_id === 'chatgpt') {
            await locals.runtime.env.DB.prepare(
                `UPDATE client_services SET last_checked_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(clientServiceId).run();
        }

        return new Response(JSON.stringify(resJson), {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });

    } catch (e: any) {
        console.error('Unhandled Error:', e);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${e.message || e}`, success: false }), { status: 500 });
    }
};
