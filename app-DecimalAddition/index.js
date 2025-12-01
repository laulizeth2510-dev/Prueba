// --- Configuration ---
const TOTAL_PROBLEMS = 20;
const MAX_ATTEMPTS = 3;
const FIXED_DISPLAY_PRECISION = 2; // Fixed precision for user input/display
const MAX_WHOLE_PART = 20; // Max whole number for all terms

// --- State ---
let state = {
  currentProblemIndex: 0, // 0 to 19 (for 20 problems)
  correctlySolved: 0,
  currentProblem: null, // Stores { terms: [], answer: 0 }
  attemptCounters: 0,
  // Track which problems should be guaranteed subtractions (50% of total)
  subtractionIndices: Array.from({ length: TOTAL_PROBLEMS }, (_, i) => i)
    .sort(() => 0.5 - Math.random()) // Shuffle the indices
    .slice(0, TOTAL_PROBLEMS / 2), // Take the first half
};

// --- Helper Functions ---

/** Rounds a number to a fixed number of decimal places (to handle floating point errors). */
function roundToPrecision(num, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

/** * Generates a random decimal number with a specified or random precision (1-3 decimal places).
 * @param {number} maxWhole - Maximum value for the whole number part.
 * @param {number} fixedPrecision - Optional. If provided, uses this precision.
 */
function generateDecimal(maxWhole, fixedPrecision = null) {
  const wholePart = Math.floor(Math.random() * maxWhole) + 1; // +1 to avoid 0.xx leading to issues

  let randomPrecision = fixedPrecision || Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

  let decimalValue = Math.random();
  let decimal = wholePart + decimalValue;

  return roundToPrecision(decimal, randomPrecision);
}

// --- Problem Generation Logic ---

/** Generates an array of decimal terms. */
function generateProblem(isForcedSubtraction) {
  let terms = [];

  if (isForcedSubtraction) {
    // 1. Guaranteed Subtraction (Two terms only)
    // Goal: Term 1 (Minuend) has less precision than Term 2 (Subtrahend).

    let numDecimals1, numDecimals2;

    // Ensure Minuend precision < Subtrahend precision
    numDecimals1 = Math.floor(Math.random() * 2) + 1; // 1 or 2
    numDecimals2 = 3; // Always 3 for the subtrahend to ensure zero-filling practice

    // Generate two numbers where t1 > t2
    let t1Value, t2Value;
    let attempts = 0;
    do {
      t1Value = generateDecimal(MAX_WHOLE_PART, numDecimals1);
      t2Value = generateDecimal(MAX_WHOLE_PART / 2, numDecimals2); // Subtrahend is intentionally smaller to guarantee positive result
      attempts++;
      // Safety: Ensure t1 is strictly greater than t2 to prevent negative result
    } while (t1Value <= t2Value && attempts < 20);

    // If t1Value is still not greater than t2Value after attempts, force it
    if (t1Value <= t2Value) {
      t1Value = t2Value + generateDecimal(5, 2); // t1 = t2 + small_positive_number
    }

    terms.push({ value: t1Value, op: '+' });
    terms.push({ value: t2Value, op: '-' });
  } else {
    // 2. Standard Random Problem (2, 3, or 4 terms)
    const numTerms = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 terms

    // First term (Minuend) must be large and positive
    const t1 = { value: generateDecimal(MAX_WHOLE_PART), op: '+' };
    terms.push(t1);

    // Subsequent terms
    for (let i = 1; i < numTerms; i++) {
      const term = {};
      term.value = generateDecimal(MAX_WHOLE_PART / 2); // Keep subsequent values smaller
      // 50/50 chance for + or -
      term.op = Math.random() < 0.5 ? '+' : '-';
      terms.push(term);
    }
  }

  return terms;
}

/** Calculates the result of the decimal problem. */
function calculateAnswer(terms) {
  let result = 0;

  // For robust internal calculation, convert to integers based on max precision
  const internalPrecision = 5; // Use a fixed high precision for safety

  terms.forEach((t) => {
    // To minimize floating point issues, calculate using rounding
    if (t.op === '+') {
      result = roundToPrecision(result + t.value, internalPrecision);
    } else if (t.op === '-') {
      result = roundToPrecision(result - t.value, internalPrecision);
    }
  });

  // Round the final answer to the display precision for user comparison
  // This is the number the user MUST match (to 2 decimal places)
  return roundToPrecision(result, FIXED_DISPLAY_PRECISION);
}

// --- Rendering Functions ---

/** Renders the decimal problem on the screen. */
function renderProblem(terms) {
  const problemDisplay = document.getElementById('problemDisplay');
  problemDisplay.innerHTML = '';

  terms.forEach((t, index) => {
    // Add operator if it's not the first term
    if (index > 0) {
      const opSpan = document.createElement('span');
      opSpan.className = 'operator-display';
      opSpan.textContent = t.op;
      problemDisplay.appendChild(opSpan);
    }

    // Create term display structure
    const termSpan = document.createElement('span');
    termSpan.className = 'term-display';
    // Show terms with their actual precision, not fixed 2
    termSpan.textContent = t.value.toString();
    problemDisplay.appendChild(termSpan);
  });

  // Add equals sign
  const eqSpan = document.createElement('span');
  eqSpan.className = 'operator-display';
  eqSpan.textContent = '=';
  problemDisplay.appendChild(eqSpan);
}

/** Renders the next problem in the sequence. */
function nextProblem() {
  if (state.currentProblemIndex >= TOTAL_PROBLEMS) {
    // End of exercise
    document.getElementById('problemDisplay').innerHTML = `
                    <p class="text-3xl font-extrabold text-green-700">Exercise Complete!</p>
                    <p class="text-xl text-gray-700 mt-2">Final Score: ${state.correctlySolved} out of ${TOTAL_PROBLEMS}</p>
                `;
    document.getElementById('checkButton').disabled = true;
    document.getElementById('inputAnswer').disabled = true;
    return;
  }

  // Reset state for new problem
  state.attemptCounters = 0;

  // Clear inputs and feedback
  document.getElementById('inputAnswer').value = '';
  document.getElementById('checkButton').disabled = false;
  document.getElementById('inputAnswer').disabled = false;
  document.getElementById('feedbackArea').classList.add('hidden');

  // --- START: PROBLEM GENERATION LOGIC TO ENSURE NON-NEGATIVE RESULT AND SPECIFIC TYPES ---
  let terms;
  let answer;
  let resultIsNegative = true;
  let attempts = 0;
  const MAX_GENERATION_ATTEMPTS = 100;

  // Check if the current problem index is one of the designated subtraction indices
  const isForcedSubtraction = state.subtractionIndices.includes(
    state.currentProblemIndex
  );

  do {
    terms = generateProblem(isForcedSubtraction);
    answer = calculateAnswer(terms);

    // Final check to ensure the total expression result is non-negative
    resultIsNegative = answer < 0;
    attempts++;

    // Safety break to prevent infinite loops
    if (attempts > MAX_GENERATION_ATTEMPTS) {
      console.error(
        'Could not generate a non-negative result problem after 100 attempts. Forcing a simple positive sum.'
      );
      // Force a simple positive sum to break the loop
      terms = [
        { value: 15.0, op: '+' },
        { value: 3.5, op: '+' },
      ];
      answer = calculateAnswer(terms);
      resultIsNegative = false;
    }
  } while (resultIsNegative);
  // --- END: PROBLEM GENERATION LOGIC ---

  // Store and render the validated problem
  state.currentProblem = { terms, answer };

  renderProblem(terms);

  // Update display
  document.getElementById('currentProblemDisplay').textContent =
    state.currentProblemIndex + 1;
  updateProgress();
}

/** Updates the progress bar and score display. */
function updateProgress() {
  const progress = (state.currentProblemIndex / TOTAL_PROBLEMS) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;
  document.getElementById(
    'scoreDisplay'
  ).textContent = `Score: ${state.correctlySolved}/${state.currentProblemIndex}`;
}

// --- Interaction Functions ---

/** Handles the user submitting an answer. */
function checkAnswer() {
  const inputAnswerElement = document.getElementById('inputAnswer');
  const feedbackArea = document.getElementById('feedbackArea');
  const checkButton = document.getElementById('checkButton');

  const userAnswerString = inputAnswerElement.value.trim();
  const userAnswer = parseFloat(userAnswerString);

  // 1. Input Validation
  if (isNaN(userAnswer)) {
    feedbackArea.textContent = 'Please enter a valid number.';
    feedbackArea.className = 'feedback feedback-incorrect';
    feedbackArea.classList.remove('hidden');
    return;
  }

  // 2. Comparison
  const correct = state.currentProblem.answer;

  // The required answer formatted to exactly 2 decimal places for strict comparison
  const correctFormattedString = correct.toFixed(FIXED_DISPLAY_PRECISION);

  // Check if the user's input string matches the strictly formatted correct answer string
  // This ensures both the value and the rounding/formatting are correct.
  const isCorrect = userAnswerString === correctFormattedString;

  // Fallback for cases where parseFloat might handle trailing zeros differently (e.g., input "5" vs "5.00")
  // This ensures that simple whole numbers are still considered correct if formatted.
  const isValueCorrectButNotFormatted =
    roundToPrecision(userAnswer, FIXED_DISPLAY_PRECISION) === correct;

  if (
    isCorrect ||
    (isValueCorrectButNotFormatted &&
      userAnswerString.length <= correctFormattedString.length &&
      correctFormattedString.endsWith('.00'))
  ) {
    // CORRECT ANSWER: Exact match of the rounded value and the required format (or a simplified version of a whole number)
    state.correctlySolved++;
    state.currentProblemIndex++; // Move to next problem

    feedbackArea.innerHTML =
      '<strong>Correct! 🎉</strong> Well done! Rounding to two decimal places is correct. Moving to the next problem in 2 seconds...';
    feedbackArea.className = 'feedback feedback-correct';
    feedbackArea.classList.remove('hidden');

    // Block input and wait for transition
    inputAnswerElement.disabled = true;
    checkButton.disabled = true;

    setTimeout(nextProblem, 2000);
  } else if (isValueCorrectButNotFormatted) {
    // INCORRECT FORMAT/ROUNDING: The value is correct, but the number of decimals is wrong (e.g., input 5.673 or 5.6)
    state.attemptCounters++;
    const attemptsLeft = MAX_ATTEMPTS - state.attemptCounters;

    if (attemptsLeft > 0) {
      feedbackArea.innerHTML = `
                        <strong>Incorrect ❌</strong> The value is almost correct, but remember: you must enter your answer 
                        <span style="font-weight: 700; color: var(--color-math-pink);">rounded exactly to ${FIXED_DISPLAY_PRECISION} decimal places</span>.
                        Attempts remaining: ${attemptsLeft}.
                    `;
      feedbackArea.className = 'feedback feedback-incorrect';
    } else {
      // MAX ATTEMPTS REACHED - Reveal Answer
      state.currentProblemIndex++; // Move to next problem

      feedbackArea.innerHTML = `
                        <strong>Maximum attempts reached.</strong> The correct value rounded to two decimal places is: 
                        <span class="text-2xl font-extrabold text-orange-700">${correctFormattedString}</span>.
                        Moving to the next problem in 5 seconds... 😥
                    `;
      feedbackArea.className = 'mt-6 p-4 rounded-xl feedback-input failed';

      // Block input and wait for transition
      inputAnswerElement.disabled = true;
      checkButton.disabled = true;

      setTimeout(nextProblem, 5000);
    }
    feedbackArea.classList.remove('hidden');
  } else {
    // INCORRECT VALUE: The value is mathematically wrong.
    state.attemptCounters++;
    const attemptsLeft = MAX_ATTEMPTS - state.attemptCounters;

    if (attemptsLeft > 0) {
      // INCORRECT - Attempts Left
      feedbackArea.innerHTML = `<strong>Incorrect ❌</strong> Please try again. Attempts remaining: ${attemptsLeft}.`;
      feedbackArea.className = 'feedback feedback-incorrect';
    } else {
      // MAX ATTEMPTS REACHED - Reveal Answer
      state.currentProblemIndex++; // Move to next problem

      feedbackArea.innerHTML = `
                        <strong>Maximum attempts reached.</strong> The correct value rounded to two decimal places is: 
                        <span class="text-2xl font-extrabold text-orange-700">${correctFormattedString}</span>.
                        Moving to the next problem in 5 seconds... 😥
                    `;
      feedbackArea.className = 'mt-6 p-4 rounded-xl feedback-input failed';

      // Block input and wait for transition
      inputAnswerElement.disabled = true;
      checkButton.disabled = true;

      setTimeout(nextProblem, 5000);
    }
    feedbackArea.classList.remove('hidden');
  }
}

// --- Initialization ---

window.onload = function () {
  // Start the first problem
  nextProblem();
};
