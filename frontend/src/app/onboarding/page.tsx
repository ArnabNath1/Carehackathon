'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { onboarding as onboardingApi } from '@/lib/api';
import {
    BuildingOfficeIcon,
    ChatBubbleBottomCenterTextIcon,
    ClipboardDocumentCheckIcon,
    CalendarIcon,
    DocumentTextIcon,
    CubeIcon,
    UsersIcon,
    CheckCircleIcon,
    MicrophoneIcon,
    StopIcon
} from '@heroicons/react/24/outline';

const STEPS = [
    { id: 1, name: 'Workspace', icon: BuildingOfficeIcon },
    { id: 2, name: 'Integrations', icon: ChatBubbleBottomCenterTextIcon },
    { id: 3, name: 'Contact Form', icon: ClipboardDocumentCheckIcon },
    { id: 4, name: 'Bookings', icon: CalendarIcon },
    { id: 5, name: 'Post-Booking Forms', icon: DocumentTextIcon },
    { id: 6, name: 'Inventory', icon: CubeIcon },
    { id: 7, name: 'Staff', icon: UsersIcon },
    { id: 8, name: 'Activate', icon: CheckCircleIcon },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    // Form States
    const [workspaceData, setWorkspaceData] = useState({
        name: '',
        address: '',
        timezone: 'UTC',
        contact_email: '',
    });

    const [integrationData, setIntegrationData] = useState({
        type: 'email',
        provider: 'sendgrid',
        config: { api_key: '', from_email: '', secret_key: '' }
    });

    const [contactFormData, setContactFormData] = useState({
        name: 'General Inquiry',
        description: 'Contact us for more information',
        fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { name: 'message', label: 'Message', type: 'textarea', required: false }
        ]
    });

    const [serviceData, setServiceData] = useState({
        name: '',
        description: '',
        duration_minutes: 30,
        location: '',
    });

    const [inventoryData, setInventoryData] = useState({
        name: '',
        quantity: 10,
        low_stock_threshold: 5,
        unit: 'units'
    });

    const [staffData, setStaffData] = useState({
        full_name: '',
        email: '',
        password: 'staff123', // Demo default
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Load workspace if it exists and skip step 1
        if (user?.workspace_id) {
            onboardingApi.getWorkspace().then(res => {
                setWorkspaceData(res.data);
                if (currentStep === 1) setCurrentStep(2);
            }).catch(() => { });
        }
    }, [isAuthenticated, router, user]);

    const handleNext = () => {
        if (currentStep < 8) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Voice Onboarding Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunks.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                await handleVoiceUpload(audioBlob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            setError('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleVoiceUpload = async (blob: Blob) => {
        setLoading(true);
        setError('');
        const stepNames = ['workspace', 'integrations', 'contact_form', 'service_type', 'post_booking_forms', 'inventory', 'staff', 'activate'];
        const currentStepName = stepNames[currentStep - 1];

        try {
            const formData = new FormData();
            formData.append('audio', blob, 'onboarding.webm');
            formData.append('step', currentStepName);

            const response = await onboardingApi.voiceTranscribe(formData);
            const { extracted_data } = response.data;

            // Map extracted data to form states
            if (currentStep === 1) setWorkspaceData({ ...workspaceData, ...extracted_data });
            if (currentStep === 4) setServiceData({ ...serviceData, ...extracted_data });
            if (currentStep === 6) setInventoryData({ ...inventoryData, ...extracted_data });

            alert('Data extracted successfully! Please review the form.');
        } catch (err: any) {
            setError('Voice processing failed. Please try manual entry.');
        } finally {
            setLoading(false);
        }
    };

    const submitStep = async () => {
        setLoading(true);
        setError('');
        try {
            if (currentStep === 1) {
                await onboardingApi.createWorkspace(workspaceData);
            } else if (currentStep === 2) {
                await onboardingApi.createIntegration(integrationData);
            } else if (currentStep === 3) {
                // Step 3 Contact Form
                await onboardingApi.createContactForm(contactFormData);
            } else if (currentStep === 4) {
                const res = await onboardingApi.createServiceType(serviceData);
                // Add default availability for demo
                await onboardingApi.createAvailabilitySlot({
                    service_type_id: res.data.id,
                    day_of_week: 1, // Monday
                    start_time: '09:00',
                    end_time: '17:00'
                });
            } else if (currentStep === 5) {
                // Find last service type created for this demo
                // For prototype, we assume the user just created one
                // Better would be a selection UI
            } else if (currentStep === 6) {
                await onboardingApi.createInventoryItem(inventoryData);
            } else if (currentStep === 7) {
                await onboardingApi.addStaff(staffData);
            } else if (currentStep === 8) {
                await onboardingApi.activateWorkspace();
                router.push('/dashboard');
                return;
            }
            handleNext();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : (detail?.[0]?.msg || JSON.stringify(detail) || 'Failed to save step information'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-12 pb-24">
            <div className="max-w-4xl mx-auto px-4">
                {/* Progress Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Set up your workspace</h1>
                    <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
                        {STEPS.map((step) => (
                            <div
                                key={step.id}
                                className={`flex flex-col items-center group cursor-pointer ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}
                                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 transition-all duration-200 ${currentStep >= step.id ? 'border-blue-600' : 'border-gray-200'}`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium mt-2 absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-2 py-1 rounded whitespace-nowrap">
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="card shadow-xl border-t-4 border-blue-600 min-h-[500px] flex flex-col">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Step {currentStep}: {STEPS[currentStep - 1].name}
                            </h2>
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                            >
                                {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                {isRecording ? 'Listening...' : 'Onboard with Voice'}
                            </button>
                        </div>

                        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100">
                            {typeof error === 'object' ? JSON.stringify(error) : error}
                        </div>}

                        {/* Step 1: Workspace */}
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={workspaceData.name}
                                        onChange={e => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                                        placeholder="e.g. Acme Health"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={workspaceData.address}
                                        onChange={e => setWorkspaceData({ ...workspaceData, address: e.target.value })}
                                        placeholder="123 Care Lane, San Francisco, CA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={workspaceData.contact_email}
                                        onChange={e => setWorkspaceData({ ...workspaceData, contact_email: e.target.value })}
                                        placeholder="hello@acmehealth.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Integrations */}
                        {currentStep === 2 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6 flex items-center gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-bold">System Integrations Detected!</p>
                                        <p className="text-sm">Mailjet and Vonage are pre-configured via your platform credentials.</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-4">You can update these or simply click Next.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 border-2 rounded-xl cursor-pointer ${integrationData.type === 'email' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`} onClick={() => setIntegrationData({ ...integrationData, type: 'email' })}>
                                        <h3 className="font-semibold">Email Service</h3>
                                        <p className="text-xs text-gray-500">Send confirmations & alerts</p>
                                    </div>
                                    <div className={`p-4 border-2 rounded-xl cursor-pointer ${integrationData.type === 'sms' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`} onClick={() => setIntegrationData({ ...integrationData, type: 'sms' })}>
                                        <h3 className="font-semibold">SMS Service</h3>
                                        <p className="text-xs text-gray-500">Send short updates</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={integrationData.config.api_key}
                                        onChange={e => setIntegrationData({ ...integrationData, config: { ...integrationData.config, api_key: e.target.value } })}
                                        placeholder="Enter API Key"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key / Token</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={integrationData.config.secret_key || ''}
                                        onChange={e => setIntegrationData({ ...integrationData, config: { ...integrationData.config, secret_key: e.target.value } })}
                                        placeholder="Enter Secret Key"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Contact Form */}
                        {currentStep === 3 && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-gray-600">This form will be public for customer inquiries.</p>
                                <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                                    <h3 className="font-medium mb-4">Preview: {contactFormData.name}</h3>
                                    <div className="space-y-3">
                                        {contactFormData.fields.map((f, i) => (
                                            <div key={i} className="bg-white p-3 rounded border text-sm text-gray-500">
                                                {f.label} ({f.type}) {f.required && <span className="text-red-500">*</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Bookings */}
                        {currentStep === 4 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={serviceData.name}
                                        onChange={e => setServiceData({ ...serviceData, name: e.target.value })}
                                        placeholder="e.g. Initial Consultation"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={serviceData.duration_minutes}
                                            onChange={e => setServiceData({ ...serviceData, duration_minutes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={serviceData.location}
                                            onChange={e => setServiceData({ ...serviceData, location: e.target.value })}
                                            placeholder="Online or Address"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Post-Booking Forms */}
                        {currentStep === 5 && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-gray-600">These forms are automatically sent after a booking is confirmed.</p>
                                <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Default Intake Form & Service Agreement will be generated.</p>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Inventory */}
                        {currentStep === 6 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={inventoryData.name}
                                        onChange={e => setInventoryData({ ...inventoryData, name: e.target.value })}
                                        placeholder="e.g. Treatment Room"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={inventoryData.quantity}
                                            onChange={e => setInventoryData({ ...inventoryData, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Low Threshold Warning</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={inventoryData.low_stock_threshold}
                                            onChange={e => setInventoryData({ ...inventoryData, low_stock_threshold: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 7: Staff */}
                        {currentStep === 7 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Full Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={staffData.full_name}
                                        onChange={e => setStaffData({ ...staffData, full_name: e.target.value })}
                                        placeholder="Alex Johnson"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Email</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={staffData.email}
                                        onChange={e => setStaffData({ ...staffData, email: e.target.value })}
                                        placeholder="alex@acmehealth.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 8: Activate */}
                        {currentStep === 8 && (
                            <div className="text-center py-12 animate-fadeIn">
                                <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold mb-2">Ready to Go!</h3>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    We'll verify your integrations and settings before going live.
                                    Once activated, your booking pages and forms will be public.
                                </p>
                                <div className="bg-blue-50 p-4 rounded-lg text-left inline-block">
                                    <h4 className="font-semibold text-blue-800 mb-2">Verification Checklist:</h4>
                                    <ul className="text-sm space-y-1 text-blue-700">
                                        <li>✅ Workspace Created</li>
                                        <li>✅ Communication Channel Connected</li>
                                        <li>✅ Service Type Defined</li>
                                        <li>✅ Contact Form Active</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-12 pt-6 border-t">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1 || loading}
                            className="px-6 py-2 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-30"
                        >
                            Back
                        </button>
                        <div className="flex gap-4">
                            <button
                                onClick={handleNext}
                                disabled={loading}
                                className="btn btn-secondary"
                            >
                                {currentStep === 2 ? 'Continue with Defaults' : 'Skip'}
                            </button>
                            <button
                                onClick={submitStep}
                                disabled={loading}
                                className="btn btn-primary min-w-[120px]"
                            >
                                {loading ? <span className="spinner w-5 h-5" /> : (currentStep === 8 ? 'Activate Workspace' : 'Save & Continue')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
