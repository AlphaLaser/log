<script lang="ts">
	import '../app.css';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	let { children } = $props();
</script>

<svelte:head>
<meta name="description" content="the no-bs logbook to track your progress/thoughts" />
<meta name="keywords" content="Yaplog, journalling, minimlism, simplistic, note-taking, yap, log" />
<meta name="author" content="aditmagotra" />
</svelte:head>


{@render children()}
