export function generateDeviceFingerprint(): string {
    // Get browser and device characteristics
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const colorDepth = window.screen.colorDepth;
    const pixelRatio = window.devicePixelRatio;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const platform = navigator.platform;
    const plugins = Array.from(navigator.plugins || []).map(p => p.name).join(',');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasFingerprint = '';
    
    if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Hello, world!', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Hello, world!', 4, 17);
        canvasFingerprint = canvas.toDataURL();
    }
    
    // Combine all characteristics
    const fingerprintData = [
        userAgent,
        language,
        colorDepth,
        pixelRatio,
        screenResolution,
        timezone,
        platform,
        plugins,
        canvasFingerprint
    ].join('|');
    
    // Create a hash of the fingerprint data
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
        const char = fingerprintData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Convert to a string and ensure it's positive
    return Math.abs(hash).toString(36);
} 