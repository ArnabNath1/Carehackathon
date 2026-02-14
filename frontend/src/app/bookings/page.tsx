'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { bookings as bookingsApi } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import {
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { format, startOfDay, addDays } from 'date-fns';

export default function BookingsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        loadBookings();
    }, [isAuthenticated, filter, selectedDate]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const res = await bookingsApi.list({
                status: filter === 'all' ? undefined : filter,
                from_date: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss")
            });
            setBookings(res.data);
        } catch (e) {
            console.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await bookingsApi.updateStatus(id, status);
            loadBookings();
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'badge-info';
            case 'completed': return 'badge-success';
            case 'no_show': return 'badge-error';
            case 'cancelled': return 'bg-gray-200 text-gray-700';
            default: return 'badge-warning';
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Navbar />

            <main className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                        <p className="text-gray-500">Manage appointments and customer visits</p>
                    </div>
                    <button className="btn btn-primary flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" /> New Booking
                    </button>
                </div>

                {/* Filters & Calendar */}
                <div className="grid lg:grid-cols-4 gap-8 mb-8">
                    <div className="lg:col-span-3 card flex items-center justify-between py-4">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeftIcon className="w-5 h-5" /></button>
                                <div className="text-center min-w-[150px]">
                                    <p className="text-sm font-semibold text-gray-900">{format(selectedDate, 'MMMM d, yyyy')}</p>
                                    <p className="text-xs text-blue-600 font-medium">Today</p>
                                </div>
                                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRightIcon className="w-5 h-5" /></button>
                            </div>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <div className="flex gap-2">
                                {['all', 'pending', 'confirmed', 'completed'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <input type="text" placeholder="Search bookings..." className="pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="card py-4 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                            <p className="text-xs text-gray-500 font-medium">Total for this day</p>
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-24"><div className="spinner"></div></div>
                    ) : bookings.length === 0 ? (
                        <div className="card py-24 text-center">
                            <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500">No bookings found for this selection</p>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div key={booking.id} className="card hover:border-blue-200 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-lg font-bold text-gray-900">{format(new Date(booking.scheduled_at), 'HH:mm')}</p>
                                            <p className="text-xs text-gray-400 font-medium">{booking.service_types?.duration_minutes} min</p>
                                        </div>

                                        <div className="h-12 w-px bg-gray-100"></div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 text-lg">{booking.contacts?.name}</h3>
                                                <span className={`badge ${getStatusColor(booking.status)}`}>{booking.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="font-medium text-blue-600">{booking.service_types?.name}</span>
                                                <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {booking.service_types?.location || 'At Business'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 px-8">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                <span className="flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> {booking.contacts?.phone || 'N/A'}</span>
                                                <span className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4" /> {booking.contacts?.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {booking.status === 'pending' && (
                                            <button onClick={() => updateStatus(booking.id, 'confirmed')} className="btn btn-primary text-xs">Confirm</button>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <button onClick={() => updateStatus(booking.id, 'completed')} className="btn btn-success text-xs">Complete</button>
                                        )}
                                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                            <button onClick={() => updateStatus(booking.id, 'no_show')} className="btn btn-secondary text-xs text-red-600">No Show</button>
                                        )}
                                        <button className="p-2 text-gray-400 hover:text-gray-600"><UserIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
