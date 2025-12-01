// --- Quiz State Variables ---
let currentNumber = 0;
let checksData = []; // Stores the result of getDivisibilityRules()
let userAnswers = {}; // {2: null, 3: null, ...}
const divisors = [2, 3, 5, 6, 7, 9, 10];

// DOM References
const randomNumberDisplay = document.getElementById('randomNumberDisplay');
const quizOptionsContainer = document.getElementById('quizOptions');
const feedbackListContainer = document.getElementById('feedbackListContainer');
const finalScoreContainer = document.getElementById('finalScoreContainer');

// State tracking variables
let answersCount = 0;
let correctCount = 0;

// --- Utilities ---

/**
 * Calculates the sum of digits of a number (absolute value).
 */
function getSumOfDigits(num) {
  return String(Math.abs(num))
    .split('')
    .map(Number)
    .reduce((sum, digit) => sum + digit, 0);
}

/**
 * Generates divisibility rules and correct answers.
 */
function getDivisibilityRules(num) {
  const absNumber = Math.abs(num);
  const sumOfDigits = getSumOfDigits(num);
  const lastDigit = absNumber % 10;

  return [
    {
      divisor: 2,
      isMultiple: absNumber % 2 === 0,
      rule: `The number ${absNumber} ends in ${lastDigit}. To be a multiple of 2, the last digit must be 0, 2, 4, 6, or 8.`,
      icon: '🔢',
    },
    {
      divisor: 3,
      isMultiple: sumOfDigits % 3 === 0,
      rule: `The sum of its digits is ${sumOfDigits}. To be a multiple of 3, the sum of its digits (${sumOfDigits}) must be divisible by 3.`,
      icon: '➕',
    },
    {
      divisor: 5,
      isMultiple: lastDigit === 0 || lastDigit === 5,
      rule: `The number ${absNumber} ends in ${lastDigit}. To be a multiple of 5, the last digit must be 0 or 5.`,
      icon: '✋',
    },
    {
      divisor: 6,
      isMultiple: absNumber % 2 === 0 && sumOfDigits % 3 === 0,
      rule: `It must be a multiple of 2 AND 3 at the same time. Check if the divisibility rules for 2 and 3 are satisfied.`,
      icon: '🔄',
    },
    {
      divisor: 7,
      isMultiple: absNumber % 7 === 0,
      rule: `The easiest way is to divide ${absNumber} by 7. Rule: Subtract double the last digit from the remaining number; the result must be divisible by 7.`,
      icon: '⭐',
    },
    {
      divisor: 9,
      isMultiple: sumOfDigits % 9 === 0,
      rule: `The sum of its digits is ${sumOfDigits}. To be a multiple of 9, the sum of its digits (${sumOfDigits}) must be divisible by 9.`,
      icon: '✨',
    },
    {
      divisor: 10,
      isMultiple: lastDigit === 0,
      rule: `The number ${absNumber} ends in ${lastDigit}. To be a multiple of 10, the last digit must be 0.`,
      icon: '🔟',
    },
  ];
}

// --- Quiz Logic ---

/**
 * Renders the individual feedback card for a divisor.
 * @param {number} divisor - The divisor checked.
 */
function renderIndividualFeedback(divisor) {
  const check = checksData.find((c) => c.divisor === divisor);
  const userAnswer = userAnswers[divisor];
  const isCorrect = userAnswer === check.isMultiple;

  if (isCorrect) correctCount++;
  answersCount++;

  const colorClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
  const resultText = isCorrect ? 'Correct!' : 'Incorrect!';
  const feedbackIcon = isCorrect ? '✅' : '❌';
  const correctLabel = check.isMultiple
    ? 'YES is a multiple'
    : 'NO is not a multiple';

  const feedbackItem = document.createElement('div');
  feedbackItem.className = `feedback-item ${colorClass}`;
  feedbackItem.id = `feedback-${divisor}`;
  feedbackItem.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                    ${feedbackIcon} Multiple of ${divisor}
                </h3>
                <span style="font-family: var(--font-body); font-weight: 700; font-size: 1.1rem; padding: 0.5rem 1rem; border-radius: 20px; ${
                  isCorrect
                    ? 'background: var(--color-math-green); color: white;'
                    : 'background: var(--color-math-pink); color: white;'
                }">
                    ${resultText}
                </span>
            </div>
            <p style="font-family: var(--font-handwriting); font-size: 1.1rem; margin-top: 0.5rem;">
                <span style="font-weight: 700;">Your Answer:</span> ${
                  userAnswer ? 'YES' : 'NO'
                }
                <span style="margin-left: 1rem; font-weight: 700;">Correct Answer:</span> ${correctLabel}
            </p>
            <p style="font-family: var(--font-body); margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px dashed var(--border-color);">
                <span style="font-weight: 600; color: var(--color-math-purple);">💡 Rule:</span> ${
                  check.rule
                }
            </p>
        `;
  feedbackListContainer.appendChild(feedbackItem);

  // If all answers have been given, show the final score
  if (answersCount === divisors.length) {
    displayFinalScore();
  }
}

/**
 * Displays the final score summary.
 */
function displayFinalScore() {
  const totalChecks = divisors.length;
  const percentage = ((correctCount / totalChecks) * 100).toFixed(0);
  const scoreMessage = `Final Score: ${correctCount} out of ${totalChecks} (${percentage}%)`;

  let emoji = '🎉';
  if (percentage >= 90) emoji = '🌟';
  else if (percentage >= 70) emoji = '🎉';
  else if (percentage >= 50) emoji = '👍';
  else emoji = '💪';

  const scoreBox = document.createElement('div');
  scoreBox.className = 'score-box';
  scoreBox.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;">${emoji}</div>
            <h2 class="score-text">${scoreMessage}</h2>
            <p class="handwriting" style="margin-top: 1rem; font-size: 1.2rem; color: var(--text-secondary);">
                ${percentage >= 70 ? 'Great job!' : 'Keep practicing!'}
            </p>
        `;

  finalScoreContainer.appendChild(scoreBox);
}

/**
 * Selects the user's answer, provides individual feedback, and initiates final check if necessary.
 * @param {number} divisor - The divisor the answer applies to.
 * @param {boolean} answer - The user's answer (true = YES, false = NO).
 * @param {HTMLElement} btnYes - YES button.
 * @param {HTMLElement} btnNo - NO button.
 */
function selectAnswer(divisor, answer, btnYes, btnNo) {
  // If already has a registered answer (and buttons are disabled), do nothing
  if (userAnswers[divisor] !== null) return;

  userAnswers[divisor] = answer;

  // Visual selection logic
  if (answer === true) {
    btnYes.classList.add('selected-yes');
  } else {
    btnNo.classList.add('selected-no');
  }

  // Disable buttons for this criterion once answered
  btnYes.disabled = true;
  btnNo.disabled = true;

  // Provide immediate feedback
  renderIndividualFeedback(divisor);
}

/**
 * Generates a new random number and resets the quiz.
 */
function generateNewNumber() {
  // Generate a random number between 1 and 1000 (excluding 0)
  currentNumber = Math.floor(Math.random() * 999) + 1;

  // Reset state and counters
  userAnswers = {};
  answersCount = 0;
  correctCount = 0;
  feedbackListContainer.innerHTML = '';
  finalScoreContainer.innerHTML = '';

  // Update the UI
  randomNumberDisplay.textContent = currentNumber;

  // Calculate and store the rules and correct answers
  checksData = getDivisibilityRules(currentNumber);
  renderQuizOptions(checksData);
}

/**
 * Renders the YES/NO buttons for each divisor.
 * @param {Array} checks - List of divisors and rules.
 */
function renderQuizOptions(checks) {
  quizOptionsContainer.innerHTML = '';

  checks.forEach((check) => {
    const divisor = check.divisor;

    // Initialize user answer
    userAnswers[divisor] = null;

    const optionDiv = document.createElement('div');
    optionDiv.className = 'quiz-item';

    optionDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="quiz-label">
                        ${check.icon} Is it a multiple of <span class="divisor-number">${divisor}</span>?
                    </span>
                    <div style="display: flex; gap: 0.75rem;">
                        <button id="btnYes${divisor}" class="quiz-option" data-answer="true">YES</button>
                        <button id="btnNo${divisor}" class="quiz-option" data-answer="false">NO</button>
                    </div>
                </div>
            `;

    quizOptionsContainer.appendChild(optionDiv);

    // Assign listeners after attaching to DOM
    const btnYes = document.getElementById(`btnYes${divisor}`);
    const btnNo = document.getElementById(`btnNo${divisor}`);

    // Use bind to pass correct parameters to selectAnswer
    btnYes.onclick = selectAnswer.bind(null, divisor, true, btnYes, btnNo);
    btnNo.onclick = selectAnswer.bind(null, divisor, false, btnYes, btnNo);
  });
}

// --- Initialization ---
window.onload = () => {
  generateNewNumber();
};
