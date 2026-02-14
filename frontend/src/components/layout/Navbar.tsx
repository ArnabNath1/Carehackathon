'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
    HomeIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    UserGroupIcon,
    ArrowRightOnRectangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Inbox', href: '/inbox', icon: ChatBubbleLeftRightIcon },
        { name: 'Bookings', href: '/bookings', icon: CalendarIcon },
        { name: 'Onboarding', href: '/onboarding', icon: SparklesIcon },
    ];

    if (!user) return null;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 flex flex-col">
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold gradient-text">CareOps</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-semibold'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-gray-500 hover:text-red-600 transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Log out
                </button>
            </div>
        </aside>
    );
}
