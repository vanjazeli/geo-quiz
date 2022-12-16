<script>
    import {flagLists} from './stores';
    let currentIndex = 0;
    const shifting = ()=>{
        setTimeout(()=>{
            currentIndex++;
            shifting();
        },1000);
    }
    shifting();
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap" rel="stylesheet">
</svelte:head>

<img src="{$flagLists.europe[currentIndex].flagPath}" alt="{$flagLists.europe[currentIndex].name + '.svg'}">
<h1>{$flagLists.europe[currentIndex].name}</h1>