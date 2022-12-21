<script>
    import {flagLists, view} from './stores';
    import Menu from './components/Menu.svelte';
    import Quiz from './components/Quiz.svelte';

    let list = Object.keys($flagLists);
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap" rel="stylesheet">
    <title>Geo Quiz</title>
</svelte:head>

<div class="app">
    <div class="app__wrap">
        {#if $view === 'menu'}
        <Menu/>
        {/if}
        {#if $view === "europe"}
        <Quiz quizType="europe"/>
        {/if}
        {#if $view === "northAmerica"}
        <Quiz quizType="northAmerica"/>
        {/if}
    </div>
</div>