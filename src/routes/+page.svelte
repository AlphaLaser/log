<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { generateDeviceFingerprint } from '$lib/deviceFingerprint';
    
    let content = '';
    let todaysLogCount = 0;
    let showNotification = false;
    let notificationTimestamp = '';
    let notificationTimeout: number;
    const STORAGE_KEY = 'auto-save-content';
    const DEVICE_ID_KEY = 'device-id';
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const shortcutKey = isMac ? '⌘' : 'ctrl';
    
    let deviceId: string;
    
    onMount(() => {
        // Get or generate device ID
        deviceId = localStorage.getItem(DEVICE_ID_KEY) || generateDeviceFingerprint();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
        
        const savedContent = localStorage.getItem(STORAGE_KEY);
        if (savedContent) {
            content = savedContent;
        }
        
        // Fetch today's log count
        fetchTodaysLogCount();

        // Add keyboard shortcut listener
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (notificationTimeout) {
                clearTimeout(notificationTimeout);
            }
        };
    });
    
    function handleKeyDown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            handleLog();
        }
    }
    
    async function fetchTodaysLogCount() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { count, error } = await supabase
                .from('logs')
                .select('*', { count: 'exact', head: true })
                .eq('device_id', deviceId)
                .gte('timestamp', today.toISOString());
            
            if (error) {
                console.error('Error fetching count:', error);
                return;
            }
            
            console.log('Fetched count:', count);
            todaysLogCount = count || 0;
        } catch (error) {
            console.error('Error fetching log count:', error);
        }
    }
    
    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        content = target.value;
        localStorage.setItem(STORAGE_KEY, content);
    }

    function showLogNotification(timestamp: string) {
        showNotification = true;
        notificationTimestamp = timestamp;
        
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
        
        notificationTimeout = window.setTimeout(() => {
            showNotification = false;
        }, 3000);
    }

    function closeNotification() {
        showNotification = false;
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
    }

    async function handleLog() {
        if (!content.trim()) return;
        
        const timestamp = new Date().toISOString();
        
        try {
            const { error } = await supabase
                .from('logs')
                .insert([
                    { content, timestamp, device_id: deviceId }
                ]);
            
            if (error) {
                console.error('Error inserting log:', error);
                return;
            }
            
            // Clear the content after successful save
            content = '';
            localStorage.setItem(STORAGE_KEY, '');
            
            // Update today's log count
            await fetchTodaysLogCount();
            
            // Show notification
            showLogNotification(timestamp);
        } catch (error) {
            console.error('Error saving to Supabase:', error);
        }
    }
</script>

<div class="relative h-screen bg-white">
    <textarea
        bind:value={content}
        on:input={handleInput}
        class="w-full h-[calc(100vh-4rem)] p-4 resize-none outline-none border-none font-mono bg-white text-gray-900"
        placeholder="just start typing :)"
    ></textarea>
    
    {#if showNotification}
        <div class="absolute top-4 right-4 bg-gray-100 text-gray-600 px-4 py-2 rounded font-mono text-sm flex items-center gap-2 animate-fade-in">
            <span>input logged at {new Date(notificationTimestamp).toLocaleTimeString()}</span>
            <button 
                on:click={closeNotification}
                class="text-gray-400 hover:text-gray-600 text-xs"
            >
                ×
            </button>
        </div>
    {/if}
    
    <div class="absolute bottom-4 left-4">
        <span class="text-gray-500 text-sm font-mono">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()} | {todaysLogCount} inputs logged.
        </span>
    </div>
    
    <div class="absolute bottom-4 right-4 flex gap-2">
        <a
            href="/logs"
            class="bg-white text-black border border-black px-4 py-2 rounded font-mono text-sm hover:bg-gray-100 transition-colors"
        >
            view logs
        </a>
        <!-- <button
            on:click={async () => {
                const shareUrl = `${window.location.origin}/logs?device_id=${deviceId}`;
                await navigator.clipboard.writeText(shareUrl);
                showLogNotification(new Date().toISOString());
            }}
            class="bg-white text-black border border-black px-4 py-2 rounded font-mono text-sm hover:bg-gray-100 transition-colors"
        >
            share logs
        </button> -->
        <button
            on:click={handleLog}
            class="bg-black text-white px-4 py-2 rounded font-mono text-sm hover:bg-gray-800 transition-colors"
        >
            log ({shortcutKey} + ↵)
        </button>
    </div>
</div>

<style>
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }
</style>
