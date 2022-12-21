<script>
    import {flagLists} from './stores';
    import Quiz from './components/Quiz.svelte';
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap" rel="stylesheet">
    <title>Geo Quiz</title>
</svelte:head>

<div class="app">
    <div class="app__wrap">
        <Quiz quizType="europe"/>
    </div>
</div>