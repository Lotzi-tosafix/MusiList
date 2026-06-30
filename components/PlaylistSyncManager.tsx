'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function PlaylistSyncManager({ playlistId, lastSyncAt }: { playlistId: string, lastSyncAt: string | null }) {
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setTimeout(() => setIsSyncing(true), 0);
        try {
            const res = await fetch('/api/youtube/playlist/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playlistId })
            });
            const data = await res.json();
            if (data.success && data.count > 0) {
                // Only refresh if we actually added new items
                router.refresh();
            }
        } catch (error) {
            console.error('Error syncing playlist:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const lastSync = lastSyncAt ? new Date(lastSyncAt).getTime() : 0;
        const now = Date.now();
        
        // Auto sync if older than 1 hour (3600000 ms) or never synced
        if (now - lastSync > 3600000) {
            handleSync();
        }
    }, [playlistId, lastSyncAt]);

    if (isSyncing) {
        return (
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 text-xs text-slate-300 shadow-xl z-20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>מסנכרן עדכונים...</span>
            </div>
        );
    }
    
    return null;
}
