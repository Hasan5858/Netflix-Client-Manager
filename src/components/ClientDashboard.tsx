import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import ClientStatus from './ClientStatus';

interface Props {
    clientId: string;
    clientName: string;
}

interface Service {
    id: number;
    service_id: string;
    service_name: string;
    expires_at: string;
    master_email?: string;
    credential_email?: string;
    profile_name?: string;
}

const serviceColors: Record<string, string> = {
    netflix: 'bg-red-600 text-white',
    prime: 'bg-blue-500 text-white',
    hbo: 'bg-purple-600 text-white',
    chatgpt: 'bg-green-600 text-white',
    hoichoi: 'bg-orange-600 text-white'
};

const getServiceColor = (serviceId: string): string => {
    return serviceColors[serviceId.toLowerCase()] || 'bg-gray-600 text-white';
};

const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
};

export default function ClientDashboard({ clientId: propClientId, clientName: propClientName }: Props) {
    // Fallback to reading from data attributes if props are undefined
    const clientId = propClientId || (typeof window !== 'undefined' && document.querySelector('[data-client-id]')?.getAttribute('data-client-id')) || '';
    const clientName = propClientName || (typeof window !== 'undefined' && document.querySelector('[data-client-name]')?.getAttribute('data-client-name')) || '';
    
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    useEffect(() => {
        if (clientId) {
            fetchServices();
        }
    }, [clientId]);

    const fetchServices = async () => {
        if (!clientId) {
            setError('Client ID is missing');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/assignments?clientId=${clientId}`);
            
            if (!res.ok) {
                throw new Error('Failed to fetch services');
            }
            
            const data = await res.json();
            console.log('Fetched services:', data);
            console.log('Client ID:', clientId);
            setServices(data || []);
        } catch (err) {
            console.error('Fetch services error:', err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
                <p className="text-gray-400">Loading services...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={fetchServices}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-lg">No services assigned yet</p>
                <p className="text-gray-600 text-sm mt-2">Contact support to get services assigned</p>
            </div>
        );
    }

    return (
        <>
            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {services.map((service) => {
                    const expired = isExpired(service.expires_at);
                    const expiryDate = new Date(service.expires_at);
                    const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    return (
                        <div
                            key={service.id}
                            className={`bg-[#1f1f1f] rounded-lg border transition ${
                                expired
                                    ? 'border-red-600/30 bg-red-900/5'
                                    : 'border-gray-800 hover:border-gray-700'
                            }`}
                        >
                            <div className="p-4">
                                {/* Service Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded font-bold text-xs flex items-center justify-center ${getServiceColor(service.service_id)}`}>
                                            {service.service_name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{service.service_name}</h3>
                                            <p className="text-xs text-gray-500">{service.service_id.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    {expired && (
                                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold">EXPIRED</span>
                                    )}
                                </div>

                                {/* Service Details */}
                                <div className="space-y-2 mb-4 text-sm text-gray-400">
                                    {service.master_email && (
                                        <p><span className="text-gray-600">Email:</span> {service.master_email}</p>
                                    )}
                                    {service.credential_email && (
                                        <p><span className="text-gray-600">Account:</span> {service.credential_email}</p>
                                    )}
                                    {service.profile_name && (
                                        <p><span className="text-gray-600">Profile:</span> {service.profile_name}</p>
                                    )}
                                </div>

                                {/* Expiry Info */}
                                <div className={`text-xs font-mono p-2 rounded ${
                                    expired
                                        ? 'bg-red-900/30 text-red-400 border border-red-600/30'
                                        : 'bg-gray-900/50 text-gray-400 border border-gray-800'
                                }`}>
                                    {expired ? (
                                        <p>Expired on {expiryDate.toLocaleDateString()}</p>
                                    ) : (
                                        <p>Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</p>
                                    )}
                                </div>

                                {/* Action Button */}
                                {!expired && (
                                    <button
                                        onClick={() => setSelectedService(service)}
                                        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition text-sm"
                                    >
                                        Get Access
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Client Status Modal */}
            {selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md">
                        <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded text-xs flex items-center justify-center font-bold ${getServiceColor(selectedService.service_id)}`}>
                                        {selectedService.service_name[0]}
                                    </div>
                                    {selectedService.service_name}
                                </h2>
                                <button
                                    onClick={() => setSelectedService(null)}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <ClientStatus
                                    clientServiceId={selectedService.id}
                                    lang="en"
                                    serviceType={selectedService.service_id}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
