<script lang="ts">
	import { getContext } from 'svelte';

	const user = getContext<UserType>('user');
</script>

<div class="flex flex-col justify-center items-center gap-3">
	<h3 class="text-2xl font-bold">Hi {user.displayName}!</h3>

	{#if user.photoURL}
		<img src={user.photoURL} width="100" alt="user avatar" />
	{/if}
	<p>Your userID is {user.uid}</p>
</div>
