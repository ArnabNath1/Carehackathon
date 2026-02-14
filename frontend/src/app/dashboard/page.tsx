'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { dashboard as dashboardApi } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import {
    CalendarIcon,
    ChatBubbleBottomCenterTextIcon,
    DocumentTextIcon,
    CubeIcon,
    SparklesIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon,
    ClipboardDocumentCheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        loadDashboard(selectedDate);
    }, [isAuthenticated, router, selectedDate]);

    const loadDashboard = async (date?: string) => {
        setLoading(true);
        try {
            const response = await dashboardApi.getOverview(date);
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const runAIAnalysis = async () => {
        setLoadingAnalysis(true);
        setIsAnalysisOpen(true);
        setAnalysis(null);
        try {
            const response = await dashboardApi.getAnalysis(selectedDate);
            setAnalysis(response.data.analysis);
        } catch (error) {
            setAnalysis("Failed to generate analysis. Please try again later.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    const stats = [
        { name: "Today's Bookings", value: dashboardData?.bookings?.today_count || 0, icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Unread Messages', value: dashboardData?.leads?.unread_messages || 0, icon: ChatBubbleBottomCenterTextIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Pending Forms', value: dashboardData?.forms?.pending_count || 0, icon: DocumentTextIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
        { name: 'Inventory Alerts', value: dashboardData?.inventory?.low_stock_count || 0, icon: CubeIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Navbar />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Workspace Overview</h1>
                        <p className="text-gray-500">Managing {user?.workspace_id ? 'your business' : 'global operations'} for {selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'today' : selectedDate}.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Target Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            />
                        </div>
                        <div className="h-10 w-px bg-gray-200 mx-2"></div>
                        <Link href="/onboarding" className="btn btn-secondary flex items-center gap-2">
                            Update Setup
                        </Link>
                        <button
                            onClick={runAIAnalysis}
                            className="btn btn-primary shadow-lg shadow-blue-100 flex items-center gap-2"
                        >
                            <SparklesIcon className="w-5 h-5" /> AI Analysis
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.name} className="card hover:scale-[1.02] transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                    <ArrowTrendingUpIcon className="w-3 h-3" /> +12%
                                </span>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {typeof stat.value === 'object' ? JSON.stringify(stat.value) : stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Timeline / Bookings */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="card">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Schedule for {format(new Date(selectedDate), 'PPP')}</h3>
                                <Link href="/bookings" className="text-blue-600 text-sm font-semibold hover:underline">View Calendar</Link>
                            </div>
                            {dashboardData?.bookings?.today_bookings?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.bookings.today_bookings.map((booking: any) => (
                                        <div key={booking.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                            <div className="text-center min-w-[60px]">
                                                <p className="text-sm font-bold text-gray-900">{format(new Date(booking.scheduled_at), 'HH:mm')}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Today</p>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200"></div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">
                                                    {typeof booking.contact?.name === 'object' ? JSON.stringify(booking.contact.name) : (booking.contact?.name || 'Unknown')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {typeof booking.service_types?.name === 'object' ? JSON.stringify(booking.service_types.name) : (booking.service_types?.name || 'General Appointment')}
                                                </p>
                                            </div>
                                            <span className={`badge ${booking.status === 'confirmed' ? 'badge-info' :
                                                booking.status === 'completed' ? 'badge-success' : 'badge-warning'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400">No appointments scheduled for today</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Alerts */}
                        <div className="card">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Critical Alerts</h3>
                            <div className="space-y-4">
                                {dashboardData?.alerts?.recent_alerts?.slice(0, 3).map((alert: any) => (
                                    <div key={alert.id} className={`p-4 rounded-2xl border flex items-start gap-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                                        }`}>
                                        <div className={`p-2 rounded-xl ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {alert.severity === 'critical' ? '🚨' : '⚠️'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">
                                                {typeof alert.title === 'object' ? JSON.stringify(alert.title) : alert.title}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {typeof alert.message === 'object' ? JSON.stringify(alert.message) : alert.message}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold">{format(new Date(alert.created_at), 'HH:mm')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-8">
                        <div className="card bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-xl shadow-blue-200">
                            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href={`/book/${user?.workspace_id}`} target="_blank" className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-center group">
                                    <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-blue-100 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Booking Link</span>
                                </Link>
                                <Link href={`/contact/${user?.workspace_id}`} target="_blank" className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-center group">
                                    <ClipboardDocumentCheckIcon className="w-6 h-6 mx-auto mb-2 text-blue-100 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Contact Form</span>
                                </Link>
                                <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-center group">
                                    <UserGroupIcon className="w-6 h-6 mx-auto mb-2 text-blue-100 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Invite Staff</span>
                                </button>
                                <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-center group">
                                    <ArrowTrendingUpIcon className="w-6 h-6 mx-auto mb-2 text-blue-100 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold">Marketing</span>
                                </button>
                            </div>
                        </div>

                        {/* Low Stock Preview */}
                        <div className="card">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CubeIcon className="w-5 h-5 text-gray-400" /> Inventory Needs
                            </h3>
                            <div className="space-y-4">
                                {dashboardData?.inventory?.low_stock_items?.slice(0, 4).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                            <p className="text-[10px] text-gray-500">Only {item.quantity} {item.unit} left</p>
                                        </div>
                                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Order</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* AI Analysis Modal */}
            <Transition appear show={isAnalysisOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[100]" onClose={() => setIsAnalysisOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-xl">
                                                <SparklesIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                                                AI Business Insights
                                            </Dialog.Title>
                                        </div>
                                        <button
                                            onClick={() => setIsAnalysisOpen(false)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <XMarkIcon className="w-6 h-6 text-gray-400" />
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        {loadingAnalysis ? (
                                            <div className="py-12 flex flex-col items-center justify-center gap-4">
                                                <div className="spinner w-12 h-12 border-4 border-blue-600 border-t-transparent"></div>
                                                <p className="text-gray-500 animate-pulse font-medium">Analyzing your workspace data...</p>
                                            </div>
                                        ) : (
                                            <div className="prose prose-blue max-w-none">
                                                <div className="bg-gray-50 rounded-2xl p-6 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {analysis}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary px-8"
                                            onClick={() => setIsAnalysisOpen(false)}
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
