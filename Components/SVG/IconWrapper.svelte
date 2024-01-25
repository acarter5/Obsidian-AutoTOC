<script>
	import Icon from "./Icon.svelte";

	export let direction = "s";
	export let option = "chevronDown";
</script>

<Icon name={option} {direction} />
