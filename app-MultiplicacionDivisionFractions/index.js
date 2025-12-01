// --- Configuration ---
const TOTAL_PROBLEMS = 20;
const MAX_ATTEMPTS = 3;
// Denominators can be slightly larger for M/D as common denominators are not needed.
const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12];

// --- State ---
let state = {
  currentProblemIndex: 0, // 0 to 19 (for 20 problems)
  correctlySolved: 0,
  currentProblem: null, // Stores { fractions: [], answer: { num: 0, den: 0 } }
  attemptCounters: 0,
};

// --- Helper Functions (Math Logic) ---

/** Calculates the Greatest Common Divisor (GCD) using the Euclidean algorithm. */
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/** Simplifies a fraction to its lowest terms. */
function simplifyFraction(num, den) {
  if (num === 0) return { num: 0, den: 1 };
  if (den === 0) return { num: 0, den: 0 };

  // Ensure the denominator is always positive
  const sign = (num < 0 && den < 0) || (num > 0 && den < 0) ? -1 : 1;

  num = Math.abs(num);
  den = Math.abs(den);

  const commonDivisor = gcd(num, den);
  return {
    num: sign * (num / commonDivisor),
    den: den / commonDivisor,
  };
}

// --- Problem Generation Logic ---

/** Generates a single random fraction. */
function generateSingleFraction() {
  const den = DENOMINATORS[Math.floor(Math.random() * DENOMINATORS.length)];
  // Keep numerator slightly larger to encourage simplification practice
  let num = Math.floor(Math.random() * (den * 2)) + 1;

  return { num, den };
}

/** Generates an array of 2, 3, or 4 fractions with random operators (* or /). */
function generateProblem() {
  const numFractions = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 fractions
  let fractions = [];

  for (let i = 0; i < numFractions; i++) {
    const fraction = generateSingleFraction();
    // Assign operator for all except the first one
    const operators = ['*', '/'];
    fraction.op =
      i === 0 ? '*' : operators[Math.floor(Math.random() * operators.length)];
    fractions.push(fraction);
  }

  // NOTE: For M/D, the result is always positive since we only use positive fractions.
  return fractions;
}

/** Calculates the simplified result of the multiplication and division problem. */
function calculateAnswer(fractions) {
  if (fractions.length === 0) return { num: 0, den: 1 };

  let resultNum = fractions[0].num;
  let resultDen = fractions[0].den;

  // Iterate over the remaining fractions
  for (let i = 1; i < fractions.length; i++) {
    const f = fractions[i];

    if (f.op === '*') {
      // Multiplication: (A/B) * (C/D) = (A*C) / (B*D)
      resultNum *= f.num;
      resultDen *= f.den;
    } else if (f.op === '/') {
      // Division: (A/B) / (C/D) = (A/B) * (D/C)
      // Multiply by the reciprocal (flip numerator and denominator)
      resultNum *= f.den; // New numerator is A * D
      resultDen *= f.num; // New denominator is B * C
    }

    // Optional: Simplify intermediate results to prevent huge numbers
    // let simplified = simplifyFraction(resultNum, resultDen);
    // resultNum = simplified.num;
    // resultDen = simplified.den;
    // NOTE: Skipping intermediate simplification to keep the logic fast, but the final result MUST be simplified.
  }

  return simplifyFraction(resultNum, resultDen);
}

// --- Rendering Functions ---

/** Renders the fraction problem on the screen. */
function renderProblem(fractions) {
  const problemDisplay = document.getElementById('problemDisplay');
  problemDisplay.innerHTML = '';

  fractions.forEach((f, index) => {
    // Add operator if it's not the first fraction
    if (index > 0) {
      const opSpan = document.createElement('span');
      opSpan.className = 'operator-display';
      opSpan.textContent = f.op === '*' ? '×' : '÷';
      problemDisplay.appendChild(opSpan);
    }

    // Create fraction display structure
    const fractionDiv = document.createElement('div');
    fractionDiv.className = 'fraction-display';
    fractionDiv.style.color = 'var(--color-math-blue)';
    fractionDiv.innerHTML = `
                    <span class="numerator">${f.num}</span>
                    <span class="fraction-bar"></span>
                    <span class="denominator">${f.den}</span>
                `;
    problemDisplay.appendChild(fractionDiv);
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
                    <p style="font-size: 2rem; font-weight: 700; color: var(--color-math-green);">Exercise Complete!</p>
                    <p style="font-size: 1.2rem; color: var(--text-secondary); margin-top: 1rem;">Final Score: ${state.correctlySolved} out of ${TOTAL_PROBLEMS}</p>
                `;
    document.getElementById('checkButton').disabled = true;
    document.getElementById('inputNum').disabled = true;
    document.getElementById('inputDen').disabled = true;
    return;
  }

  // Reset state for new problem
  state.attemptCounters = 0;

  // Clear inputs and feedback
  document.getElementById('inputNum').value = '';
  document.getElementById('inputDen').value = '';
  document.getElementById('checkButton').disabled = false;
  document.getElementById('inputNum').disabled = false;
  document.getElementById('inputDen').disabled = false;
  document.getElementById('feedbackArea').classList.add('hidden');

  // --- PROBLEM GENERATION ---
  const fractions = generateProblem();
  const answer = calculateAnswer(fractions);

  // Store and render the validated problem
  state.currentProblem = { fractions, answer };

  renderProblem(fractions);

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
  const inputNum = document.getElementById('inputNum');
  const inputDen = document.getElementById('inputDen');
  const feedbackArea = document.getElementById('feedbackArea');
  const checkButton = document.getElementById('checkButton');

  const userAnswerNum = parseInt(inputNum.value.trim(), 10);
  const userAnswerDen = parseInt(inputDen.value.trim(), 10);

  // 1. Input Validation
  if (isNaN(userAnswerNum) || isNaN(userAnswerDen) || userAnswerDen === 0) {
    feedbackArea.textContent =
      'Please enter valid, non-zero numbers for the numerator and denominator.';
    feedbackArea.className = 'feedback-item feedback-incorrect';
    feedbackArea.classList.remove('hidden');
    return;
  }

  // 2. Simplification and Comparison
  const correct = state.currentProblem.answer;
  const userSimplified = simplifyFraction(userAnswerNum, userAnswerDen);

  const isCorrect =
    userSimplified.num === correct.num && userSimplified.den === correct.den;

  if (isCorrect) {
    // CORRECT ANSWER
    state.correctlySolved++;
    state.currentProblemIndex++; // Move to next problem

    feedbackArea.innerHTML =
      '<strong>Correct! ✅</strong> Well done! Moving to the next problem in 2 seconds...';
    feedbackArea.className = 'feedback-item feedback-correct';
    feedbackArea.classList.remove('hidden');

    // Block input and wait for transition
    inputNum.disabled = true;
    inputDen.disabled = true;
    checkButton.disabled = true;

    setTimeout(nextProblem, 2000);
  } else {
    // INCORRECT ANSWER
    state.attemptCounters++;
    const attemptsLeft = MAX_ATTEMPTS - state.attemptCounters;

    if (attemptsLeft > 0) {
      // INCORRECT - Attempts Left
      feedbackArea.innerHTML = `<strong>Incorrect. ❌</strong> Please try again. Attempts remaining: ${attemptsLeft}.`;
      feedbackArea.className = 'feedback-item feedback-incorrect';
    } else {
      // MAX ATTEMPTS REACHED - Reveal Answer
      state.currentProblemIndex++; // Move to next problem

      feedbackArea.innerHTML = `
                        <strong>Maximum attempts reached.</strong> The simplified answer is: 
                        <span style="font-size: 1.5rem; font-weight: 700; color: var(--color-math-orange);">${correct.num} / ${correct.den}</span>.
                        Moving to the next problem in 5 seconds... 😥
                    `;
      feedbackArea.className = 'feedback-item feedback-failed';

      // Block input and wait for transition
      inputNum.disabled = true;
      inputDen.disabled = true;
      checkButton.disabled = true;

      setTimeout(nextProblem, 5000);
      feedbackArea.classList.remove('hidden');
    }
  }
}

// --- Initialization ---

window.onload = function () {
  // Start the first problem
  nextProblem();
};
