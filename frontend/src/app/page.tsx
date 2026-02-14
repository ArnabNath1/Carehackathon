'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <nav className="flex justify-between items-center mb-16">
                    <div className="text-2xl font-bold gradient-text">CareOps</div>
                    <div className="space-x-4">
                        <Link href="/login" className="btn btn-secondary">
                            Login
                        </Link>
                        <Link href="/register" className="btn btn-primary">
                            Get Started
                        </Link>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-6xl font-bold mb-6 animate-fadeIn">
                        <span className="gradient-text">One Platform.</span>
                        <br />
                        <span className="text-gray-800">All Your Operations.</span>
                    </h1>

                    <p className="text-xl text-gray-600 mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                        Replace the chaos of disconnected tools with a unified operations platform
                        for service-based businesses.
                    </p>

                    <div className="flex justify-center gap-4 mb-16 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
                            Start Free Trial
                        </Link>
                        <Link href="#features" className="btn btn-secondary text-lg px-8 py-3">
                            Learn More
                        </Link>
                    </div>

                    {/* Feature Grid */}
                    <div id="features" className="grid md:grid-cols-3 gap-8 mt-20">
                        <div className="card animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                            <div className="text-4xl mb-4">📅</div>
                            <h3 className="text-xl font-semibold mb-2">Smart Booking</h3>
                            <p className="text-gray-600">
                                Public booking pages with automated confirmations and reminders
                            </p>
                        </div>

                        <div className="card animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                            <div className="text-4xl mb-4">💬</div>
                            <h3 className="text-xl font-semibold mb-2">Unified Inbox</h3>
                            <p className="text-gray-600">
                                All customer communication in one place - email, SMS, and more
                            </p>
                        </div>

                        <div className="card animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold mb-2">Real-time Dashboard</h3>
                            <p className="text-gray-600">
                                See everything happening in your business at a glance
                            </p>
                        </div>

                        <div className="card animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                            <div className="text-4xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold mb-2">Form Management</h3>
                            <p className="text-gray-600">
                                Automated form distribution and completion tracking
                            </p>
                        </div>

                        <div className="card animate-fadeIn" style={{ animationDelay: '0.7s' }}>
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold mb-2">Inventory Tracking</h3>
                            <p className="text-gray-600">
                                Monitor stock levels with automated low-stock alerts
                            </p>
                        </div>

                        <div className="card animate-fadeIn" style={{ animationDelay: '0.8s' }}>
                            <div className="text-4xl mb-4">🎙️</div>
                            <h3 className="text-xl font-semibold mb-2">Voice Onboarding</h3>
                            <p className="text-gray-600">
                                Set up your workspace by voice or manual entry
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trial CTA Section */}
                <div className="mt-32 max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-12 text-white text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold mb-4">Ready to unify your operations?</h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join 500+ service providers scaling their businesses with CareOps.
                            Start your 14-day free trial today. No credit card required.
                        </p>
                        <Link href="/register" className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 inline-block shadow-lg">
                            Get Started for Free
                        </Link>
                        <div className="mt-6 flex items-center justify-center gap-8 text-sm text-blue-100">
                            <span className="flex items-center gap-2">✅ Instant Setup</span>
                            <span className="flex items-center gap-2">✅ AI Powered</span>
                            <span className="flex items-center gap-2">✅ Support 24/7</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 mt-20 py-8">
                <div className="container mx-auto px-4 text-center text-gray-600">
                    <p>&copy; 2026 CareOps. Built for the CareOps Hackathon.</p>
                </div>
            </footer>
        </div>
    );
}
