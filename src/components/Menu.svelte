<script>
    import {flagLists, view} from '../stores';

    let list = Object.keys($flagLists);

    const camelToPascal = (string) => {
        const temp = string.replace(/([A-Z])/g, " $1");
        const finalResult = temp.charAt(0).toUpperCase() + temp.slice(1);
        return finalResult;
    }

    const openQuiz = (quizName) => {
        $view = quizName;
    }
</script>

<div class="menu">
    <div class="menu__background-wrap">
        <div class="menu__background-holder">
            <img src="./assets/images/flags/north-america/nicaragua.svg" alt="nicaragua.svg" class="menu__background">
        </div>
    </div>
    <h1 class="menu__heading">Geo Quiz</h1>
    <div class="menu__list">
        {#each list as item}
        <button class="menu__button button-main hover-default" on:click={() => openQuiz(item)}>{camelToPascal(item)}</button>
        {/each}
    </div>
</div>