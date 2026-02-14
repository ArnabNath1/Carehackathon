'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { bookings as bookingsApi, onboarding as onboardingApi } from '@/lib/api';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function PublicBookingPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [workspace, setWorkspace] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [contactData, setContactData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    useEffect(() => {
        loadInitialData();
    }, [workspaceId]);

    useEffect(() => {
        if (selectedService && selectedDate) {
            loadSlots();
        }
    }, [selectedService, selectedDate]);

    const loadInitialData = async () => {
        try {
            // For prototype, we might need a public workspace endpoint
            // Using existing internal one for demo (might fail if not logged in)
            // I should add a public workspace info endpoint in backend
            // For now, let's assume we can get it or use a placeholder
            setLoading(true);
            // Fetch services (I need a public service list endpoint)
            // For now, let's just use mock data if API fails
            try {
                // Mocking for prototype demonstration if needed
                setWorkspace({ name: 'CareOps Service Business', address: '123 Business Way' });
                setServices([
                    { id: '72212002-164a-4054-9daa-bbe8e2e1e5a7', name: 'Standard Consultation', duration_minutes: 30, description: 'General health check' },
                    { id: 'b0e01297-c6b2-4d56-8e50-4d431c0e8fca', name: 'Follow-up Session', duration_minutes: 60, description: 'Detailed review' },
                ]);
            } catch (e) {
                setError('Failed to load business information');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await bookingsApi.getAvailableSlots(selectedService.id, dateStr, workspaceId);
            setAvailableSlots(response.data.available_slots);
        } catch (e) {
            // Mock slots for demo
            const mockSlots = [
                format(new Date(selectedDate.setHours(9, 0, 0, 0)), "yyyy-MM-dd'T'HH:mm:ss"),
                format(new Date(selectedDate.setHours(10, 0, 0, 0)), "yyyy-MM-dd'T'HH:mm:ss"),
                format(new Date(selectedDate.setHours(14, 0, 0, 0)), "yyyy-MM-dd'T'HH:mm:ss"),
            ];
            setAvailableSlots(mockSlots);
        }
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !selectedService) return;

        setBookingLoading(true);
        setError('');
        try {
            await bookingsApi.createPublicBooking({
                booking_data: {
                    service_type_id: selectedService.id,
                    scheduled_at: selectedSlot,
                    notes: contactData.notes
                },
                contact_data: {
                    name: contactData.name,
                    email: contactData.email,
                    phone: contactData.phone
                },
                workspace_id: workspaceId
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create booking. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full card text-center py-12">
                    <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                    <p className="text-gray-600 mb-8">
                        Thank you, {contactData.name}. We've sent a confirmation email with all the details.
                    </p>
                    <div className="bg-gray-50 p-6 rounded-xl mb-8 text-left">
                        <p className="text-sm font-medium text-gray-500 mb-1">Service</p>
                        <p className="font-semibold text-gray-900 mb-4">{selectedService.name}</p>
                        <p className="text-sm font-medium text-gray-500 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">
                            {format(parseISO(selectedSlot!), 'PPPPp')}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary w-full"
                    >
                        Book Another Appointment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Public Header */}
            <div className="bg-white border-b border-gray-200 py-8 px-4 text-center mb-8">
                <h1 className="text-4xl font-extrabold gradient-text mb-2">{workspace?.name}</h1>
                <p className="text-gray-600">{workspace?.address}</p>
            </div>

            <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
                {/* Step 1: Select Service */}
                <div className="lg:col-span-1">
                    <div className="card h-full">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
                            Select Service
                        </h2>
                        <div className="space-y-4">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedService?.id === service.id ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4" /> {service.duration_minutes} min
                                        </span>
                                    </div>
                                    {service.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 2: Select Date & Time */}
                <div className="lg:col-span-2">
                    <div className="card mb-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
                            Choose Date & Time
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                                    Select Date
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[...Array(12)].map((_, i) => {
                                        const date = addDays(startOfDay(new Date()), i);
                                        const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDate(date)}
                                                className={`p-2 rounded-lg flex flex-col items-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <span className="text-[10px] uppercase font-bold">{format(date, 'EEE')}</span>
                                                <span className="text-lg font-bold">{format(date, 'd')}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-blue-600" />
                                    Available Times
                                </label>
                                {!selectedService ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
                                        Select a service first
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableSlots.map((slot) => {
                                            const isSelected = selectedSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`p-3 rounded-xl font-bold border-2 transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-100 text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {format(parseISO(slot), 'p')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        No slots available for this day.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Contact Details */}
                    <div className={`card transition-all duration-500 ${!selectedSlot ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">3</span>
                            Your Information
                        </h2>

                        <form onSubmit={handleBooking} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-gray-400" /> Full Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        className="input"
                                        value={contactData.name}
                                        onChange={e => setContactData({ ...contactData, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <EnvelopeIcon className="w-4 h-4 text-gray-400" /> Email Address
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        className="input"
                                        value={contactData.email}
                                        onChange={e => setContactData({ ...contactData, email: e.target.value })}
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" /> Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        className="input"
                                        value={contactData.phone}
                                        onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400" /> Any notes?
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={contactData.notes}
                                        onChange={e => setContactData({ ...contactData, notes: e.target.value })}
                                        placeholder="Anything we should know?"
                                    />
                                </div>
                            </div>

                            {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-4 rounded-lg border border-red-100">{error}</div>}

                            <button
                                type="submit"
                                disabled={bookingLoading}
                                className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-blue-200"
                            >
                                {bookingLoading ? <span className="spinner w-6 h-6 border-white border-t-transparent" /> : 'Confirm Booking'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
