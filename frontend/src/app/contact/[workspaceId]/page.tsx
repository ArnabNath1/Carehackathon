'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { onboarding as onboardingApi, inbox as inboxApi } from '@/lib/api';
import {
    PaperAirplaneIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    UserIcon
} from '@heroicons/react/24/outline';

export default function PublicContactPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [workspace, setWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    useEffect(() => {
        const fetchWorkspace = async () => {
            try {
                const response = await onboardingApi.getWorkspacePublic(workspaceId);
                setWorkspace(response.data);
            } catch (err) {
                console.error("Failed to fetch workspace:", err);
                setWorkspace({ name: 'CareOps Support', address: 'Global Support Team' });
            } finally {
                setLoading(false);
            }
        };
        fetchWorkspace();
    }, [workspaceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await inboxApi.submitContactForm({
                ...formData,
                workspace_id: workspaceId
            });
            setSuccess(true);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : (detail?.[0]?.msg || JSON.stringify(detail) || 'Something went wrong. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full card text-center py-12">
                    <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Message Sent!</h1>
                    <p className="text-gray-600 mb-8">
                        Thank you for reaching out to {workspace?.name}. Our team will get back to you shortly.
                    </p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="btn btn-primary w-full"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold gradient-text mb-4">{workspace?.name}</h1>
                    <p className="text-gray-600">Have a question? We're here to help.</p>
                </div>

                <div className="card shadow-2xl border-t-4 border-blue-600">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-blue-600" /> Your Name
                            </label>
                            <input
                                required
                                type="text"
                                className="input"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4 text-blue-600" /> Email
                                </label>
                                <input
                                    required
                                    type="email"
                                    className="input"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-blue-600" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">How can we help?</label>
                            <textarea
                                required
                                rows={5}
                                className="input resize-none"
                                placeholder="Tell us more about your inquiry..."
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-4 rounded-lg">{error}</div>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <span className="spinner w-6 h-6 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center text-sm text-gray-400">
                    Powered by <span className="font-bold text-blue-600">CareOps</span>
                </div>
            </div>
        </div>
    );
}
