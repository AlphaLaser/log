<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { generateDeviceFingerprint } from '$lib/deviceFingerprint';
    
    interface Log {
        id: string;
        content: string;
        timestamp: string;
    }
    
    let logs: Log[] = [];
    let groupedLogs: { [key: string]: Log[] } = {};
    const DEVICE_ID_KEY = 'device-id';
    
    // Get device ID from URL or generate new one
    const urlParams = new URLSearchParams(window.location.search);
    const sharedDeviceId = urlParams.get('device_id');
    const deviceId = sharedDeviceId || (localStorage.getItem(DEVICE_ID_KEY) || generateDeviceFingerprint());
    
    // If this is our own device, save the ID
    if (!sharedDeviceId) {
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    onMount(async () => {
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .eq('device_id', deviceId)
                .order('timestamp', { ascending: true });
            
            if (error) {
                console.error('Error fetching logs:', error);
                return;
            }
            
            console.log('Fetched logs:', data);
            logs = data || [];
            
            // Group logs by date
            groupedLogs = logs.reduce((acc, log) => {
                const date = new Date(log.timestamp).toLocaleDateString();
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(log);
                return acc;
            }, {} as { [key: string]: Log[] });
        } catch (error) {
            console.error('Error in logs page:', error);
        }
    });
</script>

<div class="min-h-screen bg-white p-8">
    <div class="max-w-2xl">
        {#if sharedDeviceId}
            <div class="mb-8 text-gray-500 text-sm font-mono">
                Viewing shared logs
            </div>
        {/if}
        
        {#each Object.entries(groupedLogs) as [date, dateLogs]}
            <div class="mb-8">
                <h2 class="text-gray-500 text-sm font-mono mb-4">{date}</h2>
                <div class="space-y-4">
                    {#each dateLogs as log}
                        <div class="flex items-center">
                            <p class="text-gray-400 text-xs font-mono w-20">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                            <div class="border-l-2 border-gray-200 pl-4 flex-1">
                                <p class="text-gray-900 font-mono whitespace-pre-wrap">{log.content}</p>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div> 