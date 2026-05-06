import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, X, AlertOctagon, MessageSquare } from 'lucide-react';

interface Props {
    clientServiceId: number;
    lang: 'en' | 'bn';
    serviceType?: string;
}

const translations = {
    en: {
        checkBtn: "Check for Verification Link",
        checkBtnCode: "Get Verification Code",
        scanning: "Scanning for verification link...",
        waitParams: "Do not close this tab. Max wait: 5 mins.",
        modalTitle: "🚀 Important Info regarding Update Link",
        modalBody: [
            "✅ Wait after sending: A link usually works for 5-15 mins. Don't be impatient immediately after sending.",
            "✅ Don't be confused by timer: The timer on screen is for the resend button usage, not link expiry.",
            "✅ Don't click repeatedly: Clicking 'Resend' repeatedly invalidates the previous link.",
            "✅ Correct Rule: Wait 5-10 mins after one request. Try again if no code arrives."
        ],
        chatgptWarning: {
            title: "⚠️ One-Time View Warning",
            body: "You can only view this code ONCE every 7 days. Make sure you are ready to use it immediately. If you need it again, you will have to contact support.",
            confirm: " I Understand, Show Code"
        },
        contactSupport: "Contact Support",
        cancel: "Cancel",
        confirm: "I Understand, Check Link"
    },
    bn: {
        checkBtn: "ভেরিফিকেশন লিঙ্ক চেক করুন",
        checkBtnCode: "ভেরিফিকেশন কোড নিন",
        scanning: "যাচাইকরণ লিঙ্ক স্ক্যান করা হচ্ছে...",
        waitParams: "এই ট্যাব বন্ধ করবেন না। সর্বোচ্চ অপেক্ষা: ৫ মিনিট।",
        modalTitle: "🚀 আপডেট লিঙ্ক সংক্রান্ত জরুরি তথ্য",
        modalBody: [
            "✅ একবার পাঠালে অপেক্ষা করুন: একটি লিঙ্ক সাধারণত ৫-১৫ মিনিট পর্যন্ত কাজ করে। তাই কোড পাঠানোর সাথে সাথেই অস্থির হবেন না।",
            "✅ টাইমার দেখে কনফিউজ হবেন না: স্ক্রিনে যে সেকেন্ড বা মিনিটের টাইমার ওঠে, সেটা শুধু দ্বিতীয়বার পাঠানোর বাটন আসার সময়। ওটা কোড নষ্ট হওয়ার সময় নয়।",
            "✅ বারবার ক্লিক করবেন না: বারবার 'Resend' বাটনে চাপ দিলে আগের লিঙ্কটি বাতিল হয়ে যায়। ফলে নতুন কোড আসতে আরও অনেক দেরি হয়।",
            "✅ সঠিক নিয়ম: একবার রিকোয়েস্ট দিয়ে অন্তত ৫ থেকে ১০ মিনিট অপেক্ষা করুন। কোড না আসলে তখন আবার চেষ্টা করুন।"
        ],
        chatgptWarning: {
            title: "⚠️ বিশেষ সতর্কবার্তা",
            body: "আপনি এই কোডটি ৭ দিনে মাত্র একবার দেখতে পারবেন। আপনি কি এখনই কোডটি ব্যবহার করতে প্রস্তুত? পুনরায় কোডের প্রয়োজন হলে সাপোর্টে যোগাযোগ করতে হবে।",
            confirm: "আমি বুঝেছি, কোড দেখান"
        },
        contactSupport: "সাপোর্টে যোগাযোগ করুন",
        cancel: "বাতিল",
        confirm: "আমি বুঝেছি, চেক করুন"
    }
};

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export default function ClientStatus({ clientServiceId, lang, serviceType }: Props) {
    const t = translations[lang];
    const [status, setStatus] = useState<'idle' | 'polling' | 'success' | 'timeout' | 'restricted'>('idle');
    const [showModal, setShowModal] = useState(false);
    // Updated state type for unified results
    const [linkData, setLinkData] = useState<{
        success: boolean;
        results: Array<{ type: string; data: string; time?: string; timestamp?: number }>;
        message?: string
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const pollStartTime = useRef<number | null>(null);

    const startPolling = () => {
        setStatus('polling');
        setLinkData(null);
        pollStartTime.current = Date.now();
        checkLink();

        // Poll every 5 seconds
        pollInterval.current = setInterval(() => {
            if (pollStartTime.current && (Date.now() - pollStartTime.current > TIMEOUT_DURATION)) {
                if (pollInterval.current) clearInterval(pollInterval.current);
                setStatus('timeout');
                return;
            }

            setRetryCount(prev => prev + 1);
            checkLink();
        }, 5000);
    };

    const checkLink = async () => {
        try {
            const res = await fetch(`/api/check-link?clientServiceId=${clientServiceId}&_=${Date.now()}`);
            const data = await res.json();

            if (data.restricted) {
                setStatus('restricted');
                setLinkData(data); // Can contain error message
                return;
            }

            if (data.success && data.results && data.results.length > 0) {
                setLinkData(data);
                setStatus('success');
                if (pollInterval.current) clearInterval(pollInterval.current);
            }
        } catch (err) {
            console.error('Polling error:', err);
        }
    };

    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        }
    }, []);

    const copyToClipboard = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        // Optional: Reset if closed while polling? For now, we keep state but stop view.
        // Ideally, if they close, we might want to stop polling or just hide.
        // Let's reset to idle if they close it manually to allow re-check.
        if (status !== 'success') {
            setStatus('idle');
            if (pollInterval.current) clearInterval(pollInterval.current);
        }
    };

    return (
        <>
            {/* Main Interface - Only Button */}
            <button
                onClick={() => { setShowModal(true); setStatus('idle'); }}
                className="w-full bg-[#222] hover:bg-[#333] text-gray-200 font-medium py-3 px-4 rounded border border-gray-700 hover:border-red-600/50 transition flex items-center justify-center gap-2 group"
            >
                <RefreshCw size={18} className="text-gray-500 group-hover:text-red-500 transition" />
                {(serviceType === 'chatgpt' || serviceType === 'prime' || serviceType === 'hoichoi') ? t.checkBtnCode : t.checkBtn}
            </button>

            {/* Modal handles all states now */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#181818] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-scale-in">

                        {/* Header */}
                        <div className="bg-red-900/10 p-4 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-500 font-bold">
                                {status === 'success' ? (
                                    <><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> <span>Success</span></>
                                ) : (
                                    <><AlertOctagon size={20} /> <span>Attention</span></>
                                )}
                            </div>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-6">

                            {/* 1. Instructions (Idle) */}
                            {status === 'idle' && (
                                <>
                                    {serviceType === 'chatgpt' ? (
                                        // ChatGPT Specific Warning (7-day restriction)
                                        <>
                                            <h3 className="text-lg font-bold text-red-500 mb-4">{t.chatgptWarning.title}</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed mb-6 border-l-4 border-red-500 pl-4 bg-red-900/10 p-3 rounded-r">
                                                {t.chatgptWarning.body}
                                            </p>
                                        </>
                                    ) : (
                                        // Standard Warning (for Netflix, Prime, Hoichoi, etc.)
                                        <>
                                            <h3 className="text-lg font-bold text-white mb-4">{t.modalTitle}</h3>
                                            <div className="space-y-3 mb-6">
                                                {t.modalBody.map((text, i) => (
                                                    <p key={i} className="text-gray-300 text-sm leading-relaxed">{text}</p>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleModalClose}
                                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded transition"
                                        >
                                            {t.cancel}
                                        </button>
                                        <button
                                            onClick={startPolling}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition"
                                        >
                                            {serviceType === 'chatgpt' ? t.chatgptWarning.confirm : t.confirm}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* 2. Polling State */}
                            {status === 'polling' && (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full"></div>
                                        <Loader2 className="w-12 h-12 text-red-600 animate-spin relative z-10" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">{t.scanning}</h4>
                                        <p className="text-sm text-gray-500 max-w-[80%] mx-auto">{t.waitParams}</p>
                                    </div>
                                </div>
                            )}

                            {/* 3. Timeout State */}
                            {status === 'timeout' && (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-fade-in-up">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-2">
                                        <X className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Link Not Found</h3>
                                    <p className="text-gray-400 text-sm max-w-[90%]">
                                        We couldn't find the verification link within 5 minutes. Please try checking again later or contact support.
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="mt-4 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded transition"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* 4. Restricted State (ChatGPT Cooldown) */}
                            {status === 'restricted' && (
                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-scale-in">
                                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 mb-2">
                                        <AlertOctagon className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                                        <p className="text-gray-400 text-sm max-w-[95%] mx-auto leading-relaxed border-l-2 border-yellow-500 pl-3 bg-yellow-900/10 p-2 text-left">
                                            {t.chatgptWarning.body}
                                        </p>
                                    </div>
                                    <a
                                        href="https://t.me/banglabash"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3 rounded transition flex items-center justify-center gap-2 mt-2"
                                    >
                                        <MessageSquare size={18} />
                                        {t.contactSupport}
                                    </a>
                                </div>
                            )}

                            {/* 3. Success State - Dynamic based on Result Type */}
                            {status === 'success' && linkData?.results?.[0] && (() => {
                                const result = linkData.results[0];
                                const isNetflix = result.type === 'Netflix Link';
                                const isAmazon = result.type === 'Amazon OTP';
                                const isChatGPT = result.type === 'ChatGPT OTP';
                                const isHoichoi = result.type === 'Hoichoi OTP';

                                return (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                                <RefreshCw size={24} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">
                                                {(isAmazon || isChatGPT || isHoichoi) ? 'OTP Code Received!' : 'Household Link Ready!'}
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-2">
                                                {(isAmazon || isChatGPT || isHoichoi) ? 'Use this code to verify your login.' : 'Use this link to update your household.'}
                                            </p>
                                            {result.time && (
                                                <p className="text-xs text-gray-500 mt-1">Received: {result.time}</p>
                                            )}
                                        </div>

                                        {(isAmazon || isChatGPT || isHoichoi) ? (
                                            // OTP UI (Amazon + ChatGPT + Hoichoi)
                                            <div className="bg-black/40 p-6 rounded-lg border border-gray-700 flex flex-col items-center gap-4">
                                                <span className="text-4xl font-mono font-bold text-white tracking-widest">{result.data}</span>
                                                <button
                                                    onClick={() => copyToClipboard(result.data)}
                                                    className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2"
                                                >
                                                    {copied ? 'Copied' : 'Copy Code'}
                                                </button>
                                            </div>
                                        ) : (
                                            // Netflix Link UI (Default)
                                            <>
                                                <div className="bg-black/40 p-1 rounded-lg border border-gray-700 flex gap-2">
                                                    <input
                                                        readOnly
                                                        value={result.data}
                                                        className="flex-1 bg-transparent border-none text-sm text-gray-300 outline-none px-3 font-mono"
                                                    />
                                                    <button
                                                        onClick={() => copyToClipboard(result.data)}
                                                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold transition"
                                                    >
                                                        {copied ? 'Copied' : 'Copy'}
                                                    </button>
                                                </div>

                                                <a
                                                    href={result.data}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block w-full bg-red-600 hover:bg-red-700 text-white text-center font-bold py-3 rounded transition shadow-lg shadow-red-900/20"
                                                >
                                                    Open Link Directly
                                                </a>
                                            </>
                                        )}

                                        {isChatGPT && (
                                            <a
                                                href="https://t.me/banglabash"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full bg-[#0088cc] hover:bg-[#0077b5] text-white text-center font-bold py-3 rounded transition flex items-center justify-center gap-2 mt-4"
                                            >
                                                <MessageSquare size={18} />
                                                {t.contactSupport}
                                            </a>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
