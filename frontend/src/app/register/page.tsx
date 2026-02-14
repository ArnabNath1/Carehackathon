'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, onboarding } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // User data
        email: '',
        password: '',
        full_name: '',
        role: 'owner',

        // Workspace data
        workspace_name: '',
        address: '',
        timezone: 'UTC',
        contact_email: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Register user (now handles workspace creation automatically)
            const userResponse = await auth.register({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                role: formData.role,
                workspace_name: formData.workspace_name,
                workspace_address: formData.address,
                workspace_timezone: formData.timezone
            });

            const { access_token, user } = userResponse.data;
            login(access_token, user);

            // Redirect to onboarding
            router.push('/onboarding');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : (detail?.[0]?.msg || JSON.stringify(detail) || 'Registration failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full animate-fadeIn">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold gradient-text mb-2">Create Your Account</h1>
                    <p className="text-gray-600">Start your free trial today</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {typeof error === 'object' ? JSON.stringify(error) : error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Business Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name
                            </label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.workspace_name}
                                onChange={(e) => setFormData({ ...formData, workspace_name: e.target.value })}
                                placeholder="Acme Services"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Address (Optional)
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Main St, City, State"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Timezone
                            </label>
                            <select
                                className="input"
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Asia/Kolkata">India Standard Time</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <span className="spinner mr-2"></span>
                                Creating account...
                            </span>
                        ) : (
                            'Create Account & Continue'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
