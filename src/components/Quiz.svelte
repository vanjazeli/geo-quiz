<script>
    import {flagLists} from "../stores";
    export let quizType;
    const flagList = $flagLists[quizType];

    let answer = '';
    let current = 0;
    const total = $flagLists[quizType].length;
    let correctAnswers = 0;
    let score = 0;

    let correct = false;
    let incorrect = false;

    const submitHandler = () => {
        if(answer === flagList[current].name){
            correct = true;
            incorrect = false;
            correctAnswers ++;
            score = correctAnswers / current;
        } else {
            incorrect = true;
            correct = false;
        }
        if(current < total - 1) {
            current++;
        } else {
            console.log("Here should go somehting else!");
        }
    }
</script>

<div class="quiz">
    <div class="quiz__background-wrap">
        <div class="quiz__background-holder">
            <img src="{flagList[current].flagPath}" alt="{flagList[current].name + ' - flag'}" class="quiz__background">
        </div>
    </div>
    <div class="quiz__image-wrap">
        <img src="{flagList[current].flagPath}" alt="{flagList[current].name + ' - flag'}" class="quiz__image">
    </div>
    <div class="quiz__board">
        <div class="quiz__score">
            <span>Score: </span>
            <span class="quiz__current">{current + 1}</span>
            <span>{total}</span>
        </div>
        <span class="quiz__percentage">{score}</span>
    </div>
    <form class="quiz__form" on:submit|preventDefault={submitHandler}>
        <input type="text" class="quiz__input hover-default {correct ? 'quiz__input--correct': ''} {incorrect ? 'quiz__input--incorrect' : ''}" bind:value={answer}>
        <button class="button-main hover-default">Enter</button>
    </form>
    {#if incorrect}
    <span class="quiz__message">Previous answer was <span class="quiz__country-name">{flagList[current - 1].name}</span></span>
    {/if}
</div>

