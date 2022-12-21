<script>
    import {flagLists} from "../stores";
    export let quizType;

    let answer = '';
    let current = 0;
    const total = $flagLists[quizType].length;
    let correctAnswers = 0;
    let score = 0;

    let correct = false;
    let incorrect = false;

    const shuffleArray = (array) => {
        for(let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    const flagList = shuffleArray($flagLists[quizType]);

    const answerChecker = () => {
        if(answer === flagList[current].name){
            correct = true;
            incorrect = false;
            correctAnswers ++;
        } else {
            incorrect = true;
            correct = false;
        }
    }

    const submitHandler = () => {
        if(current < total - 1) {
            answerChecker();
            current++;
            answer = '';
            score = ((correctAnswers / current) * 100).toFixed(2);
        } else {
            answerChecker();
            window.alert(`Your score was ${score}`);
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
            <span>Question: </span>
            <span class="quiz__current">{current + 1}</span>
            <span>{total}</span>
        </div>
        <span class="quiz__percentage">{score}</span>
    </div>
    <form class="quiz__form" on:submit|preventDefault={submitHandler}>
        <input type="text" class="quiz__input hover-default {correct ? 'correct': ''} {incorrect ? 'incorrect' : ''}" bind:value={answer}>
        <button class="button-main hover-default {correct ? 'correct': ''} {incorrect ? 'incorrect' : ''}">Enter</button>
    </form>
    {#if incorrect}
    <span class="quiz__message">Previous answer was <span class="quiz__country-name">{flagList[current - 1].name}</span></span>
    {/if}
</div>

