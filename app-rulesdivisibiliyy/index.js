// --- Quiz State Variables ---
let currentNumber = 0;
let checksData = []; // Stores the result of getDivisibilityRules()
let userAnswers = {}; // {2: null, 3: null, ...}
const divisors = [2, 3, 5, 6, 7, 9, 10];

// DOM element references
const randomNumberDisplay = document.getElementById('randomNumberDisplay');
const quizOptionsContainer = document.getElementById('quizOptions');
const finalScoreContainer = document.getElementById('finalScoreContainer');

// State tracking variables
let answersCount = 0;
let correctCount = 0;

/**
 * Calculates the sum of the digits of a number (absolute value).
 */
function getSumOfDigits(num) {
  return String(Math.abs(num))
    .split('')
    .map(Number)
    .reduce((sum, digit) => sum + digit, 0);
}

/**
 * Generates the divisibility rules and the correct answers.
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
      rule: `It must be a multiple of 2 AND 3 simultaneously. Check if the divisibility rules for 2 and 3 are met.`,
      icon: '🔄',
    },
    {
      divisor: 7,
      isMultiple: absNumber % 7 === 0,
      rule: `The simplest way is to divide ${absNumber} by 7. Rule: Subtract twice the last digit from the remaining number; the result must be divisible by 7.`,
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
 * Renders the individual feedback card for a divisor directly below its question.
 * @param {number} divisor - The divisor checked.
 */
function renderIndividualFeedback(divisor) {
  const check = checksData.find((c) => c.divisor === divisor);
  const userAnswer = userAnswers[divisor];
  const isCorrect = userAnswer === check.isMultiple;

  if (isCorrect) correctCount++;
  answersCount++;

  const feedbackClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
  const resultText = isCorrect ? 'Correct!' : 'Incorrect!';
  const feedbackIcon = isCorrect ? '✅' : '❌';
  const badgeClass = isCorrect ? 'badge-correct' : 'badge-incorrect';
  const correctLabel = check.isMultiple
    ? 'YES, it is a multiple'
    : 'NO, it is not a multiple';

  const targetContainer = document.getElementById(
    `feedback-container-${divisor}`
  );

  const feedbackItem = document.createElement('div');
  feedbackItem.className = `feedback-item ${feedbackClass} animate-result-card`;
  feedbackItem.innerHTML = `
    <div class="feedback-header">
      <h3 class="feedback-title">
        ${feedbackIcon} Result for Multiple of ${divisor}
      </h3>
      <span class="feedback-badge ${badgeClass}">
        ${resultText}
      </span>
    </div>
    <div class="feedback-details">
      <p>
        <span class="feedback-answer">Your Answer:</span> ${userAnswer ? 'YES' : 'NO'}
        <span style="margin-left: 1rem;" class="feedback-answer">Correct Answer:</span> ${correctLabel}
      </p>
      <p class="feedback-rule">
        <span class="feedback-answer">Divisibility Rule:</span> ${check.rule}
      </p>
    </div>
  `;

  // Clear previous feedback and append the new one
  targetContainer.innerHTML = '';
  targetContainer.appendChild(feedbackItem);

  // If all answers have been given, display the final score
  if (answersCount === divisors.length) {
    displayFinalScore();
  }
}

/**
 * Displays the final score summary.
 */
function displayFinalScore() {
  const totalChecks = divisors.length;
  const scoreMessage = `Final Score: ${correctCount} out of ${totalChecks} (${(
    (correctCount / totalChecks) *
    100
  ).toFixed(0)}%)`;

  const scoreBox = document.createElement('div');
  scoreBox.className =
    'text-center p-4 mb-6 bg-blue-100 border-2 border-blue-400 rounded-xl shadow-lg animate-result-card';
  scoreBox.innerHTML = `<h2 class="text-2xl font-black text-blue-800">${scoreMessage}</h2>`;

  finalScoreContainer.innerHTML = ''; // Clear previous score
  finalScoreContainer.appendChild(scoreBox);
}

/**
 * Selects the user's answer, gives individual feedback, and initiates the final check if necessary.
 * @param {number} divisor - The divisor to which the answer applies.
 * @param {boolean} answer - The user's answer (true = YES, false = NO).
 * @param {HTMLElement} btnYes - YES button.
 * @param {HTMLElement} btnNo - NO button.
 */
function selectAnswer(divisor, answer, btnYes, btnNo) {
  // If an answer is already registered (and buttons are disabled), do nothing
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

  // Give immediate feedback
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
  finalScoreContainer.innerHTML = '';

  // Update the UI
  randomNumberDisplay.textContent = currentNumber;

  // Calculate and store the rules and correct answers
  checksData = getDivisibilityRules(currentNumber);
  renderQuizOptions(checksData);
}

/**
 * Renders the YES/NO buttons for each divisor, including the dedicated feedback slot.
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
      <div class="quiz-label">
        ${check.icon} Is <span class="divisor-number">${divisor}</span> a divisor?
      </div>
      <div class="quiz-buttons">
        <button id="btnYes${divisor}" class="quiz-option" data-answer="true">YES</button>
        <button id="btnNo${divisor}" class="quiz-option" data-answer="false">NO</button>
      </div>
      <!-- Dedicated container for feedback -->
      <div id="feedback-container-${divisor}"></div>
    `;

    quizOptionsContainer.appendChild(optionDiv);

    // Assign listeners after attaching to the DOM
    const btnYes = document.getElementById(`btnYes${divisor}`);
    const btnNo = document.getElementById(`btnNo${divisor}`);

    // Use bind to pass the correct parameters to selectAnswer
    btnYes.onclick = selectAnswer.bind(null, divisor, true, btnYes, btnNo);
    btnNo.onclick = selectAnswer.bind(null, divisor, false, btnYes, btnNo);
  });
}

// --- Initialization ---
window.onload = () => {
  generateNewNumber();
};
