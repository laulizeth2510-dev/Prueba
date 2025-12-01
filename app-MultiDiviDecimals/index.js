// --- Configuration ---
const TOTAL_PROBLEMS = 20;
const NUM_MULTIPLICATION = 5; // Problems 1 to 5
const MAX_ATTEMPTS = 3;
// Maximum decimals allowed for the exact quotient (division)
const MAX_QUOTIENT_DECIMALS = 4;
// Tolerance for comparison.
const EPSILON = 1e-7;

// --- State ---
let state = {
  currentProblemIndex: 0, // 0-based index
  correctlySolved: 0,
  currentProblem: null, // Stores { op1: 0, op2: 0, answer: 0, type: 'Multiplication'/'Division' }
  attemptCounters: 0,
};

// --- Problem Generation Logic ---

/** Generates a decimal number with a maximum of 'maxDigits' total digits. */
function generateDecimalFactor(maxDigits) {
  // Decide the number of decimals (0 to maxDigits - 1)
  const numDecimals = Math.floor(Math.random() * (maxDigits - 1)) + 1;
  // The whole part has the remaining digits
  const numWholeDigits = maxDigits - numDecimals;

  let factor;
  if (numWholeDigits > 0) {
    // Generate whole part (from 1 up to 10^(numWholeDigits) - 1)
    const maxWhole = Math.pow(10, numWholeDigits) - 1;
    const minWhole = Math.pow(10, numWholeDigits - 1) || 1;
    const wholePart =
      Math.floor(Math.random() * (maxWhole - minWhole + 1)) + minWhole;

    // Generate decimal part
    let decimalPart = 0;
    if (numDecimals > 0) {
      decimalPart = parseFloat(Math.random().toFixed(numDecimals));
    }

    factor = wholePart + decimalPart;
  } else {
    // Only decimals (e.g., 0.1234)
    factor = Math.random();
  }

  // Ensure it is displayed with the appropriate precision
  return parseFloat(factor.toFixed(numDecimals));
}

/** Generates a Multiplication problem (factor1 x factor2). */
function generateMultiplicationProblem() {
  // Maximum 4 total digits per factor (e.g., 12.34 or 123.4)
  const factor1 = generateDecimalFactor(4);
  const factor2 = generateDecimalFactor(4);

  const product = factor1 * factor2;

  // The answer is stored with high precision for comparison.
  const answer = parseFloat(product.toFixed(8));

  return {
    op1: factor1,
    op2: factor2,
    answer: answer,
    type: 'Multiplication',
  };
}

/** Generates a Division problem (dividend / divisor) with an exact zero remainder. */
function generateDivisionProblem() {
  let divisor, dividend, quotient;

  // 1. Generate the Quotient (Exact answer, max 4 decimals)
  const quotientWhole = Math.floor(Math.random() * 990) + 10;
  const quotientPrecision =
    Math.floor(Math.random() * MAX_QUOTIENT_DECIMALS) + 1;

  quotient = (quotientWhole + Math.random()).toFixed(quotientPrecision);
  quotient = parseFloat(quotient);

  // 2. Generate the Divisor (between 0.1 and 5.0, with 1 to 3 decimals)
  const divisorWhole = Math.floor(Math.random() * 5);
  const divisorPrecision = Math.floor(Math.random() * 3) + 1;
  divisor = (divisorWhole + Math.random()).toFixed(divisorPrecision);
  divisor = parseFloat(divisor);
  if (divisor < 0.001) divisor = 0.001;

  // 3. Calculate the Dividend to ensure zero remainder: Dividend = Quotient * Divisor
  dividend = quotient * divisor;

  const dividendDisplayPrecision = 8;
  dividend = parseFloat(dividend.toFixed(dividendDisplayPrecision));

  return {
    op1: divisor, // Divisor
    op2: dividend, // Dividend
    answer: quotient, // Quotient (exact answer)
    type: 'Division',
  };
}

// --- Rendering and Control Functions ---

/** Renders the problem on the screen. */
function renderProblem(op1, op2, type) {
  const problemDisplay = document.getElementById('problemDisplay');
  const problemDescription = document.getElementById('problemDescription');
  const inputHint = document.getElementById('inputHint');

  if (type === 'Division') {
    // Box format for division
    problemDisplay.innerHTML = `
      <span style="color: var(--color-math-purple);">${op1.toString()}</span> 
      <span class="operation-symbol">÷</span>
      <span style="color: var(--color-math-blue);">${op2.toString()}</span>
      <span style="color: var(--text-secondary); font-size: 2rem; margin-left: 1rem;">=</span>
      <span style="color: var(--text-secondary); font-size: 2rem; margin-left: 0.5rem;">?</span>
    `;
    problemDescription.textContent =
      'Solve this decimal division problem. The result will be exact!';
    inputHint.textContent =
      'Enter the quotient (result) of the division';
  } else if (type === 'Multiplication') {
    // Simple format for multiplication
    problemDisplay.innerHTML = `
      <span style="color: var(--color-math-purple);">${op1.toString()}</span> 
      <span class="operation-symbol">×</span>
      <span style="color: var(--color-math-blue);">${op2.toString()}</span>
      <span style="color: var(--text-secondary); font-size: 2rem; margin-left: 1rem;">=</span>
      <span style="color: var(--text-secondary); font-size: 2rem; margin-left: 0.5rem;">?</span>
    `;
    problemDescription.textContent =
      'Multiply these decimal numbers. Be careful with decimal places!';
    inputHint.textContent = 'Enter the product (result) of the multiplication';
  }

  // Reset input placeholder
  document.getElementById('inputAnswer').placeholder =
    type === 'Division' ? 'Enter quotient...' : 'Enter product...';
}

/** Renders the next problem in the sequence. */
function nextProblem() {
  if (state.currentProblemIndex >= TOTAL_PROBLEMS) {
    // End of exercise - Show completion message
    document.getElementById('problemDisplay').innerHTML = `
      <div style="text-align: center;">
        <p style="font-size: 2rem; font-weight: 700; color: var(--color-math-green); margin-bottom: 1rem;">🎉 Challenge Complete!</p>
        <p style="font-size: 1.5rem; color: var(--text-primary);">Final Score: ${state.correctlySolved} out of ${TOTAL_PROBLEMS}</p>
      </div>
    `;
    document.getElementById('problemDescription').textContent = 
      `Congratulations! You've completed all decimal operations. Your accuracy: ${Math.round((state.correctlySolved / TOTAL_PROBLEMS) * 100)}%`;
    document.getElementById('checkButton').disabled = true;
    document.getElementById('inputAnswer').disabled = true;
    return;
  }

  // Reset state for the new problem
  state.attemptCounters = 0;

  // Clear inputs and feedback
  document.getElementById('inputAnswer').value = '';
  document.getElementById('checkButton').disabled = false;
  document.getElementById('inputAnswer').disabled = false;
  
  // Clear feedback area
  const feedbackArea = document.getElementById('feedbackArea');
  feedbackArea.innerHTML = '';
  feedbackArea.style.display = 'none';

  // Determine the type of problem to generate
  let problem;
  const problemIndex = state.currentProblemIndex;

  if (problemIndex < NUM_MULTIPLICATION) {
    // 0 to 4 (Multiplication)
    problem = generateMultiplicationProblem();
  } else {
    // 5 to 19 (Division)
    // Generate and validate the division problem (we keep the quotient > 1 validation logic)
    let attempts = 0;
    const MAX_GENERATION_ATTEMPTS = 100;
    do {
      problem = generateDivisionProblem();
      attempts++;
    } while (problem.answer < 1 || attempts > MAX_GENERATION_ATTEMPTS);

    if (attempts > MAX_GENERATION_ATTEMPTS) {
      console.warn('A simple division problem was generated for safety.');
      problem = { op1: 0.25, op2: 100.5, answer: 402, type: 'Division' };
    }
  }

  // Store and render the validated problem
  state.currentProblem = {
    op1: problem.op1,
    op2: problem.op2,
    answer: problem.answer,
    type: problem.type,
  };

  renderProblem(
    state.currentProblem.op1,
    state.currentProblem.op2,
    state.currentProblem.type
  );

  // Update display
  document.getElementById('currentProblemDisplay').textContent =
    state.currentProblemIndex + 1;
  updateProgress();
}

/** Updates the progress bar and score. */
function updateProgress() {
  const progress = (state.currentProblemIndex / TOTAL_PROBLEMS) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;
  document.getElementById(
    'scoreDisplay'
  ).textContent = `Score: ${state.correctlySolved}/${state.currentProblemIndex}`;
}

// --- Interaction Functions ---

/** Handles the submission of the user's answer. */
function checkAnswer() {
  const inputAnswerElement = document.getElementById('inputAnswer');
  const feedbackArea = document.getElementById('feedbackArea');
  const checkButton = document.getElementById('checkButton');

  const userAnswerString = inputAnswerElement.value.trim();
  const userAnswer = parseFloat(userAnswerString);

  // 1. Input Validation
  if (isNaN(userAnswer)) {
    feedbackArea.innerHTML = `
      <div class="feedback-item feedback-incorrect">
        <strong>⚠️ Invalid Input</strong><br>
        Please enter a valid decimal number.
      </div>
    `;
    feedbackArea.style.display = 'block';
    return;
  }

  // 2. Comparison using Tolerance (Epsilon)
  const correct = state.currentProblem.answer; // Exact value (product or quotient)
  const isDivision = state.currentProblem.type === 'Division';

  // Check if the user's input is mathematically close to the correct value
  const isCorrect = Math.abs(userAnswer - correct) < EPSILON;

  if (isCorrect) {
    // CORRECT ANSWER
    state.correctlySolved++;
    state.currentProblemIndex++; // Advance to the next problem

    const successMessage = isDivision
      ? '🎉 Excellent! The division is correct!'
      : '🎉 Perfect! The multiplication is correct!';

    feedbackArea.innerHTML = `
      <div class="feedback-item feedback-correct">
        <strong>${successMessage}</strong><br>
        Moving to the next problem in 2 seconds...
      </div>
    `;
    feedbackArea.style.display = 'block';

    // Block input and wait for transition
    inputAnswerElement.disabled = true;
    checkButton.disabled = true;

    setTimeout(nextProblem, 2000);
  } else {
    // MATHEMATICALLY INCORRECT VALUE
    state.attemptCounters++;
    const attemptsLeft = MAX_ATTEMPTS - state.attemptCounters;

    if (attemptsLeft > 0) {
      // INCORRECT - Attempts Remaining
      const instruction = isDivision
        ? 'Check your division calculation. Make sure you handle decimal places correctly.'
        : 'Review your multiplication and the decimal point positioning.';

      feedbackArea.innerHTML = `
        <div class="feedback-item feedback-incorrect">
          <strong>❌ Not quite right</strong><br>
          ${instruction}<br>
          <em>Attempts remaining: ${attemptsLeft}</em>
        </div>
      `;
    } else {
      // MAXIMUM ATTEMPTS REACHED - Reveal Answer
      state.currentProblemIndex++; // Advance to the next problem

      // Show the formatted answer
      const displayAnswer = correct.toPrecision(8).replace(/\.?0+$/, '');

      const operationType = isDivision ? 'division' : 'multiplication';

      feedbackArea.innerHTML = `
        <div class="feedback-item feedback-partial">
          <strong>😔 Maximum attempts reached</strong><br>
          The correct answer for this ${operationType} is: 
          <span style="font-size: 1.5rem; font-weight: 700; color: var(--color-math-purple);">${displayAnswer}</span><br>
          <em>Moving to the next problem in 5 seconds...</em>
        </div>
      `;

      // Block input and wait for transition
      inputAnswerElement.disabled = true;
      checkButton.disabled = true;

      setTimeout(nextProblem, 5000);
    }
    feedbackArea.style.display = 'block';
  }
}

// --- Initialization ---

window.onload = function () {
  // Start the first problem
  nextProblem();
};
