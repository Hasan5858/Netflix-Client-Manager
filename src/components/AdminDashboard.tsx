import { useState, useEffect } from 'react';
import { Trash2, Plus, Users, Mail, Loader2, RefreshCw, Key, ShieldCheck, X, Calendar, Pencil, Search } from 'lucide-react';

interface MasterEmail {
    id: number;
    email_address: string;
    password?: string;
    service_type: string;
    client_count: number;
}

// ... (Client Interface)
interface Client { id: number; name: string; api_key: string; service_count: number; }
interface ServiceAssignment {
    id: number;
    service_id: string;
    service_name: string;
    master_email?: string;
    credential_email?: string;
    credential_password?: string;
    profile_name?: string;
    pin?: string;
    expires_at: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'emails' | 'clients'>('emails');
    const [emails, setEmails] = useState<MasterEmail[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientServices, setClientServices] = useState<ServiceAssignment[]>([]);

    // Edit States
    const [editingEmail, setEditingEmail] = useState<MasterEmail | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<ServiceAssignment | null>(null);

    // Filter Logic State
    const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');

    // Search States
    const [emailSearchQuery, setEmailSearchQuery] = useState('');
    const [clientSearchQuery, setClientSearchQuery] = useState('');

    // Forms
    const [newEmail, setNewEmail] = useState('');
    const [newEmailPass, setNewEmailPass] = useState('');
    const [newServiceType, setNewServiceType] = useState('netflix');

    const [newClientName, setNewClientName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ... (Assignment Form State - Unchanged)
    const [assignServiceId, setAssignServiceId] = useState('netflix');
    const [assignMasterId, setAssignMasterId] = useState('');
    const [assignProfile, setAssignProfile] = useState('');
    const [assignPin, setAssignPin] = useState('');
    const [assignEmail, setAssignEmail] = useState('');
    const [assignPass, setAssignPass] = useState('');
    const [assignExpiry, setAssignExpiry] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [emailsRes, clientsRes] = await Promise.all([
                fetch('/api/master-emails'),
                fetch('/api/clients')
            ]);
            setEmails(await emailsRes.json());
            setClients(await clientsRes.json());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch('/api/master-emails', {
                method: 'POST',
                body: JSON.stringify({ email: newEmail, password: newEmailPass, serviceType: newServiceType }),
                headers: { 'Content-Type': 'application/json' }
            });
            setNewEmail('');
            setNewEmailPass('');
            setNewServiceType('netflix');
            fetchData();
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateMasterEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmail) return;
        setSubmitting(true);
        try {
            await fetch('/api/master-emails', {
                method: 'PUT',
                body: JSON.stringify({ id: editingEmail.id, email: newEmail, password: newEmailPass }),
                headers: { 'Content-Type': 'application/json' }
            });
            setEditingEmail(null);
            setNewEmail('');
            setNewEmailPass('');
            fetchData();
        } finally {
            setSubmitting(false);
        }
    }

    const handleDeleteMasterEmail = async (id: number) => {
        if (!confirm('Delete this Master Account?\nWARNING: All client services assigned to this account will be removed immediately.')) return;
        await fetch(`/api/master-emails?id=${id}`, { method: 'DELETE' });
        fetchData();
    }

    // Filter Logic
    // We assume backend returns service_type. If not migrated yet, might be undefined, handle gracefully.
    const uniqueServiceTypes = Array.from(new Set(emails.map(e => e.service_type || 'netflix')));

    // Apply service filter and search query for emails
    const filteredEmails = emails.filter(email => {
        const matchesServiceFilter = selectedServiceFilter === 'all' || (email.service_type || 'netflix') === selectedServiceFilter;
        const matchesSearch = emailSearchQuery === '' ||
            email.email_address.toLowerCase().includes(emailSearchQuery.toLowerCase());
        return matchesServiceFilter && matchesSearch;
    });

    // Apply search query for clients
    const filteredClients = clients.filter(client => {
        return clientSearchQuery === '' ||
            client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
            client.api_key.toLowerCase().includes(clientSearchQuery.toLowerCase());
    });

    const getServiceColor = (type: string) => {
        const t = (type || 'netflix').toLowerCase();
        switch (t) {
            case 'netflix': return 'bg-red-600 text-white';
            case 'prime': return 'bg-blue-500 text-white';
            case 'hbo': return 'bg-purple-600 text-white';
            case 'chatgpt': return 'bg-green-600 text-white';
            case 'hoichoi': return 'bg-orange-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    // ... (Same Client & Assignment Handlers)
    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch('/api/clients', {
                method: 'POST',
                body: JSON.stringify({ name: newClientName }),
                headers: { 'Content-Type': 'application/json' }
            });
            setNewClientName('');
            fetchData();
        } finally {
            setSubmitting(false);
        }
    };

    // ... (openClientModal, etc)
    const openClientModal = async (client: Client) => {
        setSelectedClient(client);
        const res = await fetch(`/api/assignments?clientId=${client.id}`);
        setClientServices(await res.json());
    };

    const startEditAssignment = (svc: ServiceAssignment) => {
        setEditingAssignment(svc);
        setAssignServiceId(svc.service_id);
        if (svc.service_id === 'netflix') {
            setAssignProfile(svc.profile_name || '');
            setAssignPin(svc.pin || '');
            const matchingMaster = emails.find(e => e.email_address === svc.master_email);
            if (matchingMaster) setAssignMasterId(matchingMaster.id.toString());
        } else {
            setAssignEmail(svc.credential_email || '');
            setAssignPass(svc.credential_password || '');
        }
        const datePart = new Date(svc.expires_at).toISOString().split('T')[0];
        setAssignExpiry(datePart);
    }

    const cancelEditAssignment = () => {
        setEditingAssignment(null);
        setAssignProfile('');
        setAssignPin('');
        setAssignEmail('');
        setAssignPass('');
        setAssignMasterId('');
        setAssignExpiry('');
    }

    const handleAssignService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setSubmitting(true);
        try {
            const method = editingAssignment ? 'PUT' : 'POST';
            const body = {
                id: editingAssignment?.id,
                clientId: selectedClient.id,
                serviceId: assignServiceId,
                masterEmailId: assignMasterId ? Number(assignMasterId) : null,
                profileName: assignProfile,
                pin: assignPin,
                credentialEmail: assignEmail,
                credentialPassword: assignPass,
                expiresAt: assignExpiry
            }
            await fetch('/api/assignments', {
                method: method,
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' }
            });
            const res = await fetch(`/api/assignments?clientId=${selectedClient.id}`);
            setClientServices(await res.json());
            cancelEditAssignment();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (id: number) => {
        if (!confirm('Remove this service?')) return;
        await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
        if (selectedClient) {
            const res = await fetch(`/api/assignments?clientId=${selectedClient.id}`);
            setClientServices(await res.json());
        }
    };

    const handleResetRestriction = async (serviceId: number, serviceName: string) => {
        if (!confirm(`Reset 7-day restriction for ${serviceName}?\nThe client will be able to check the code again immediately.`)) return;
        try {
            const res = await fetch('/api/reset-restriction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientServiceId: serviceId })
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ Restriction reset successfully!');
            } else {
                alert('❌ Failed to reset restriction');
            }
        } catch (err) {
            alert('❌ Error: ' + (err as Error).message);
        }
    };


    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="flex items-center justify-between mb-8 bg-gradient-to-r from-red-900/20 to-transparent border border-gray-800 rounded-xl p-6">
                <div>
                    <h1 className="text-3xl font-bold text-red-600 tracking-tighter mb-1">NETFLIX <span className="text-white text-xl font-normal">Resale Manager</span></h1>
                    <p className="text-sm text-gray-500">Admin Control Panel</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                        <div className="text-xs text-gray-500 uppercase">Total Stats</div>
                        <div className="flex gap-4 mt-1">
                            <div className="text-center">
                                <div className="text-lg font-bold text-red-500">{emails.length}</div>
                                <div className="text-[10px] text-gray-600">Accounts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-500">{clients.length}</div>
                                <div className="text-[10px] text-gray-600">Clients</div>
                            </div>
                        </div>
                    </div>
                    <button onClick={fetchData} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition">
                        <RefreshCw size={20} className={loading ? 'animate-spin text-red-500' : 'text-gray-400'} />
                    </button>
                    <button onClick={async () => { await fetch('/api/admin-logout', { method: 'POST' }); window.location.href = '/admin-login'; }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-bold">
                        Logout
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-800 pb-1">
                <button
                    onClick={() => setActiveTab('emails')}
                    className={`flex items-center space-x-2 pb-3 px-6 transition border-b-2 ${activeTab === 'emails' ? 'border-red-600 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <Mail size={18} />
                    <span>Master Emails ({emails.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex items-center space-x-2 pb-3 px-6 transition border-b-2 ${activeTab === 'clients' ? 'border-red-600 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <Users size={18} />
                    <span>Clients ({clients.length})</span>
                </button>
            </div>

            <div className="bg-[#141414] rounded-lg border border-gray-800 min-h-[400px]">

                {/* Master Active Tab */}
                {!loading && activeTab === 'emails' && (
                    <div className="p-6">
                        {/* Filter Bar & Search */}
                        <div className="mb-6 space-y-4">
                            {/* Search Box */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by email address..."
                                    value={emailSearchQuery}
                                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                                    className="w-full bg-[#1f1f1f] border border-gray-800 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                                />
                                {emailSearchQuery && (
                                    <button
                                        onClick={() => setEmailSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Service Filter */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedServiceFilter('all')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${selectedServiceFilter === 'all' ? 'bg-white text-black' : 'bg-[#333] text-gray-400 hover:text-white'}`}
                                >
                                    ALL ACCOUNTS
                                </button>
                                {uniqueServiceTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedServiceFilter(type)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition whitespace-nowrap ${selectedServiceFilter === type ? 'bg-white text-black' : 'bg-[#333] text-gray-400 hover:text-white'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Add/Edit Form */}
                        <form onSubmit={editingEmail ? handleUpdateMasterEmail : handleAddEmail} className="mb-8 bg-black/30 p-4 rounded border border-gray-800 relative">
                            {editingEmail && (
                                <button type="button" onClick={() => { setEditingEmail(null); setNewEmail(''); setNewEmailPass(''); }} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={16} /></button>
                            )}
                            <h3 className="text-xs uppercase font-bold text-gray-500 mb-4">{editingEmail ? 'Edit Master Account' : 'Add Master Account'}</h3>
                            <div className="flex gap-4 items-end">
                                <div className="w-1/4">
                                    <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Service</label>
                                    <select
                                        value={newServiceType}
                                        onChange={(e) => setNewServiceType(e.target.value)}
                                        className="w-full bg-[#333] border-none text-white p-3 rounded focus:ring-2 focus:ring-red-600 outline-none uppercase text-xs font-bold disabled:opacity-50"
                                        disabled={!!editingEmail} // Disable changing type on edit for now to keep it simple
                                    >
                                        <option value="netflix">Netflix</option>
                                        <option value="prime">Amazon Prime</option>
                                        <option value="hbo">HBO Max</option>
                                        <option value="chatgpt">ChatGPT</option>
                                        <option value="hoichoi">Hoichoi</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full bg-[#333] border-none text-white p-3 rounded focus:ring-2 focus:ring-red-600 outline-none"
                                        placeholder="account@service.com"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Password</label>
                                    <input
                                        type="text"
                                        value={newEmailPass}
                                        onChange={(e) => setNewEmailPass(e.target.value)}
                                        className="w-full bg-[#333] border-none text-white p-3 rounded focus:ring-2 focus:ring-red-600 outline-none"
                                        placeholder={editingEmail ? "New Password" : "SecretPass"}
                                        required
                                    />
                                </div>
                                <button disabled={submitting} type="submit" className={`px-6 py-3 rounded font-bold transition disabled:opacity-50 flex items-center gap-2 text-white ${editingEmail ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {editingEmail ? 'Update' : <><Plus size={20} /> Add</>}
                                </button>
                            </div>
                        </form>

                        {/* Results Count */}
                        {(emailSearchQuery || selectedServiceFilter !== 'all') && (
                            <div className="mb-4 text-sm text-gray-400">
                                Showing {filteredEmails.length} of {emails.length} accounts
                                {emailSearchQuery && <span className="text-red-500"> matching "{emailSearchQuery}"</span>}
                            </div>
                        )}

                        <div className="grid gap-4">
                            {filteredEmails.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Mail size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No master accounts found</p>
                                    {emailSearchQuery && <p className="text-sm mt-2">Try a different search term</p>}
                                </div>
                            ) : (
                                filteredEmails.map(email => (
                                    <div key={email.id} className="flex items-center justify-between p-4 bg-[#1f1f1f] rounded border border-gray-800">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-xs uppercase ${getServiceColor(email.service_type || 'netflix')}`}>
                                                {(email.service_type || 'netflix')[0]}
                                            </div>
                                            <div>
                                                <span className="text-lg text-gray-200 block font-medium">{email.email_address}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-gray-800">{email.service_type || 'netflix'}</span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Users size={10} /> {email.client_count || 0} Assignees
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => { setEditingEmail(email); setNewEmail(email.email_address); setNewEmailPass(email.password || ''); }} className="text-gray-400 hover:text-white transition">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteMasterEmail(email.id)} className="text-gray-400 hover:text-red-500 transition">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )))}
                        </div>
                    </div>
                )}

                {/* Clients Tab */}
                {!loading && activeTab === 'clients' && (
                    <div className="p-6">
                        {/* Search Box */}
                        <div className="mb-6">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by client name or API key..."
                                    value={clientSearchQuery}
                                    onChange={(e) => setClientSearchQuery(e.target.value)}
                                    className="w-full bg-[#1f1f1f] border border-gray-800 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                                />
                                {clientSearchQuery && (
                                    <button
                                        onClick={() => setClientSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleCreateClient} className="mb-8 flex gap-4 items-end bg-black/30 p-4 rounded border border-gray-800">
                            <div className="flex-1">
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-2">New Client Name</label>
                                <input
                                    type="text"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    className="w-full bg-[#333] border-none text-white p-3 rounded focus:ring-2 focus:ring-red-600 outline-none"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <button disabled={submitting} type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition disabled:opacity-50 flex items-center gap-2">
                                <Plus size={20} /> Create Client
                            </button>
                        </form>

                        {/* Results Count */}
                        {clientSearchQuery && (
                            <div className="mb-4 text-sm text-gray-400">
                                Showing {filteredClients.length} of {clients.length} clients
                                <span className="text-red-500"> matching "{clientSearchQuery}"</span>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No clients found</p>
                                    {clientSearchQuery && <p className="text-sm mt-2">Try a different search term</p>}
                                </div>
                            ) : (
                                filteredClients.map(client => (
                                    <div key={client.id} className="flex items-center justify-between p-4 bg-[#1f1f1f] rounded border border-gray-800 hover:border-red-600/50 transition">
                                        <div>
                                            <div className="text-lg font-medium text-white">{client.name}</div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded flex items-center gap-1 font-mono">
                                                    <Key size={12} /> {client.api_key}
                                                </span>
                                                <span className="text-xs text-gray-500">{client.service_count} Services Active</span>
                                            </div>
                                        </div>
                                        <button onClick={() => openClientModal(client)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition">
                                            Manage Services
                                        </button>
                                    </div>
                                )))}
                        </div>
                    </div>
                )}
            </div>

            {/* Service Management Modal */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-[#181818] w-full max-w-2xl rounded-xl border border-gray-700 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-[#181818] z-10">
                            <h2 className="text-xl font-bold">Manage: {selectedClient.name}</h2>
                            <button onClick={() => setSelectedClient(null)}><X className="text-gray-400 hover:text-white" /></button>
                        </div>

                        <div className="p-6">
                            {/* Add/Edit Service Form */}
                            <form onSubmit={handleAssignService} className="bg-black/30 p-4 rounded-lg border border-gray-800 mb-6 space-y-4 relative">
                                {editingAssignment && (
                                    <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                                        <span className="text-sm font-bold text-yellow-500 flex items-center gap-2">
                                            <Pencil size={14} /> Editing Service: {editingAssignment.service_name}
                                        </span>
                                        <button type="button" onClick={cancelEditAssignment} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 font-bold mb-1">Service</label>
                                        <select
                                            className="w-full bg-[#333] border-none text-white p-2 rounded"
                                            value={assignServiceId}
                                            onChange={e => setAssignServiceId(e.target.value)}
                                        >
                                            <option value="netflix">Netflix</option>
                                            <option value="prime">Amazon Prime</option>
                                            <option value="hbo">HBO Max</option>
                                            <option value="chatgpt">ChatGPT</option>
                                            <option value="hoichoi">Hoichoi</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 font-bold mb-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-[#333] border-none text-white p-2 rounded"
                                            value={assignExpiry}
                                            onChange={e => setAssignExpiry(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Logic Split: Netflix, ChatGPT, Prime & Hoichoi use Master Accounts */}
                                {(assignServiceId === 'netflix' || assignServiceId === 'chatgpt' || assignServiceId === 'prime' || assignServiceId === 'hoichoi') ? (
                                    <div className="space-y-4 border-t border-gray-800 pt-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 font-bold mb-1">Master Account (Source)</label>
                                            <select
                                                className="w-full bg-[#333] border-none text-white p-2 rounded"
                                                value={assignMasterId}
                                                onChange={e => setAssignMasterId(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Master Email</option>
                                                {emails
                                                    .filter(e => (e.service_type || 'netflix') === assignServiceId)
                                                    .map(e => <option key={e.id} value={e.id}>{e.email_address}</option>)
                                                }
                                            </select>
                                        </div>
                                        {(assignServiceId === 'netflix' || assignServiceId === 'prime') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-500 font-bold mb-1">Profile Name</label>
                                                    <input required className="w-full bg-[#333] border-none text-white p-2 rounded" value={assignProfile} onChange={e => setAssignProfile(e.target.value)} placeholder="Profile Name" />
                                                </div>
                                                {assignServiceId === 'netflix' && (
                                                    <div>
                                                        <label className="block text-xs text-gray-500 font-bold mb-1">Profile PIN</label>
                                                        <input required className="w-full bg-[#333] border-none text-white p-2 rounded" value={assignPin} onChange={e => setAssignPin(e.target.value)} placeholder="0000" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Hoichoi and ChatGPT don't require profile name/PIN */}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 font-bold mb-1">Service Email</label>
                                            <input required className="w-full bg-[#333] border-none text-white p-2 rounded" value={assignEmail} onChange={e => setAssignEmail(e.target.value)} placeholder="account@service.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 font-bold mb-1">Service Password</label>
                                            <input required className="w-full bg-[#333] border-none text-white p-2 rounded" value={assignPass} onChange={e => setAssignPass(e.target.value)} placeholder="Password123" />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={submitting} className={`w-full font-bold py-3 mt-4 rounded transition ${editingAssignment ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                                    {submitting ? 'Processing...' : (editingAssignment ? 'Update Assignment' : 'Assign Service')}
                                </button>
                            </form>

                            {/* Active Services List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase">Active Services</h3>
                                {clientServices.map(svc => (
                                    <div key={svc.id} className="flex items-center justify-between p-3 bg-[#222] rounded border border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs">
                                                {svc.service_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{svc.service_name}</div>
                                                <div className="text-xs text-gray-400">
                                                    {(svc.service_id === 'netflix' || svc.service_id === 'prime')
                                                        ? `${svc.master_email} (Profile: ${svc.profile_name})`
                                                        : svc.master_email || svc.credential_email}
                                                </div>
                                                <div className="text-[10px] text-gray-500">Expires: {new Date(svc.expires_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {svc.service_id === 'chatgpt' && (
                                                <button
                                                    onClick={() => handleResetRestriction(svc.id, svc.service_name)}
                                                    className="text-yellow-500 hover:text-yellow-400 transition"
                                                    title="Reset 7-day restriction"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => startEditAssignment(svc)} className="text-gray-500 hover:text-white transition">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteAssignment(svc.id)} className="text-gray-500 hover:text-red-500 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {clientServices.length === 0 && <p className="text-sm text-gray-500">No services assigned.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
