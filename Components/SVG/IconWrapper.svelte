<script>
	import Icon, { directions } from "./Icon.svelte";

	export let direction = "s";
	export let option = "chevronDown";
	// const onRotate = () => {
	// 	directionIndex = (directionIndex + 1) % directions.length;
	// };
</script>

<!-- <button on:click={onRotate}> -->
<Icon name={option} {direction} />
<!-- </button> -->
