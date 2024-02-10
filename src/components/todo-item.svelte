<script lang="ts">
	import { fly } from 'svelte/transition';
	import { deleteTodo, updateTodo } from '$lib/todos';
	import { getContext } from 'svelte';

	const user = getContext<UserType>('user');

	export let todo: Todo;

	function remove() {
		deleteTodo(todo.id, user.uid);
	}

	function toggleStatus() {
		updateTodo(todo.id, !todo.complete);
	}
</script>

<tr in:fly={{ x: 900, duration: 500 }}>
	<td class={todo.complete ? 'text-green-600 line-through' : ''}>
		{todo.text}
	</td>
	<td>{todo.id}</td>
	<td>
		{#if todo.complete}
			<button on:click={toggleStatus}> ✔️ </button>
		{:else}
			<button on:click={toggleStatus}> ❌ </button>
		{/if}
	</td>
	<td>
		<button on:click={remove}> 🗑 </button>
	</td>
</tr>

