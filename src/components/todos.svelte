<script lang="ts">
	import { addTodo, getTodos, getTotalTodos, getTotalUserTodos } from '$lib/todos';
	import TodoItem from '@components/todo-item.svelte';
	import { getContext } from 'svelte';

	const user = getContext<UserType>('user');

	const total = getTotalTodos();
	const userTotal = getTotalUserTodos(user.uid);

	const genText = () => Math.random().toString(36).substring(2, 15);

	let text = genText();

	const todos = getTodos(user.uid);

	function add() {
		addTodo(text, user.uid);
		text = genText();
	}
</script>

{#if $todos?.length}
	<p><b>Total Todos:</b> {$total}</p>
	<p><b>My Todos:</b> {$userTotal}</p>
	<table class="border-separate border-spacing-x-4">
		<thead>
			<tr>
				<th>Task</th>
				<th>ID</th>
				<th colspan="2">Action</th>
			</tr>
		</thead>
		<tbody>
			{#each $todos || [] as todo}
				<TodoItem {todo} />
			{/each}
		</tbody>
	</table>
{/if}
<form on:submit|preventDefault={add}>
	<input class="border p-2 rounded-lg" bind:value={text} />
	<button class="border p-2 rounded-lg bg-purple-600 text-white font-semibold" type="submit">
		Add Task
	</button>
</form>
