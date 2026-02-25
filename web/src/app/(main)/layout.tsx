import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar />
            <div className="ml-[240px] flex flex-1 flex-col">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
