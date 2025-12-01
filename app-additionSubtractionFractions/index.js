// --- Configuration ---
const TOTAL_PROBLEMS = 20;
const MAX_ATTEMPTS = 3;
const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12];
const MAX_DENOM_VALUE = 12;

// --- State ---
let state = {
  currentProblemIndex: 0,
  correctlySolved: 0,
  currentProblem: null,
  attemptCounters: 0,
};

// --- Helper Functions (Math Logic) ---

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);
const arrayLcm = (arr) => arr.reduce((acc, val) => lcm(acc, val), 1);

function simplifyFraction(num, den) {
  if (num === 0) return { num: 0, den: 1 };
  if (den === 0) return { num: 0, den: 0 };

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

function generateSingleFraction(maxDenom) {
  const den = DENOMINATORS[Math.floor(Math.random() * DENOMINATORS.length)];
  let num = Math.floor(Math.random() * (den * 2)) + 1;
  if (Math.random() < 0.2) {
    num = 1;
  }
  return { num, den };
}

function generateProblem() {
  const numFractions = Math.floor(Math.random() * 3) + 2;
  let fractions = [];

  let f1, f2, op2;
  let firstSubtractionIsNegative = true;
  let attempts = 0;
  const MAX_REGEN_ATTEMPTS = 50;

  do {
    f1 = generateSingleFraction(MAX_DENOM_VALUE);
    f1.op = '+';

    f2 = generateSingleFraction(MAX_DENOM_VALUE);
    op2 = Math.random() < 0.75 ? '+' : '-';
    f2.op = op2;

    if (op2 === '-') {
      if (f1.num * f2.den >= f2.num * f1.den) {
        firstSubtractionIsNegative = false;
      } else {
        firstSubtractionIsNegative = true;
      }
    } else {
      firstSubtractionIsNegative = false;
    }

    attempts++;
    if (attempts > MAX_REGEN_ATTEMPTS) {
      f1.num = f1.den * 2;
      firstSubtractionIsNegative = false;
    }
  } while (firstSubtractionIsNegative);

  fractions.push(f1, f2);

  for (let i = 2; i < numFractions; i++) {
    const fraction = generateSingleFraction(MAX_DENOM_VALUE);
    fraction.op = Math.random() < 0.75 ? '+' : '-';
    fractions.push(fraction);
  }

  return fractions;
}

function calculateAnswer(fractions) {
  const denominators = fractions.map((f) => f.den);
  const commonDenom = arrayLcm(denominators);

  let finalNumerator = 0;

  fractions.forEach((f) => {
    const termNumerator = f.num * (commonDenom / f.den);
    if (f.op === '+') {
      finalNumerator += termNumerator;
    } else if (f.op === '-') {
      finalNumerator -= termNumerator;
    }
  });

  return simplifyFraction(finalNumerator, commonDenom);
}

// --- Rendering Functions ---

function renderProblem(fractions) {
  const problemDisplay = document.getElementById('problemDisplay');
  problemDisplay.innerHTML = '';

  fractions.forEach((f, index) => {
    if (index > 0) {
      const opSpan = document.createElement('span');
      opSpan.className = 'operator-display';
      opSpan.textContent = f.op;
      problemDisplay.appendChild(opSpan);
    }

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

  const eqSpan = document.createElement('span');
  eqSpan.className = 'operator-display';
  eqSpan.textContent = '=';
  problemDisplay.appendChild(eqSpan);
}

function nextProblem() {
  if (state.currentProblemIndex >= TOTAL_PROBLEMS) {
    document.getElementById('problemDisplay').innerHTML = `
            <p style="font-size: 2rem; font-weight: 700; color: var(--color-math-green);">Exercise Complete!</p>
            <p style="font-size: 1.2rem; color: var(--text-secondary); margin-top: 1rem;">Final Score: ${state.correctlySolved} out of ${TOTAL_PROBLEMS}</p>
          `;
    document.getElementById('checkButton').disabled = true;
    document.getElementById('inputNum').disabled = true;
    document.getElementById('inputDen').disabled = true;
    return;
  }

  state.attemptCounters = 0;

  document.getElementById('inputNum').value = '';
  document.getElementById('inputDen').value = '';
  document.getElementById('checkButton').disabled = false;
  document.getElementById('inputNum').disabled = false;
  document.getElementById('inputDen').disabled = false;
  document.getElementById('feedbackArea').classList.add('hidden');

  let fractions;
  let answer;
  let resultIsNegative = false;
  let attempts = 0;
  const MAX_GENERATION_ATTEMPTS = 100;

  do {
    fractions = generateProblem();
    answer = calculateAnswer(fractions);
    resultIsNegative = answer.num < 0;
    attempts++;

    if (attempts > MAX_GENERATION_ATTEMPTS) {
      answer.num = 0;
      answer.den = 1;
      resultIsNegative = false;
    }
  } while (resultIsNegative);

  state.currentProblem = { fractions, answer };
  renderProblem(fractions);

  document.getElementById('currentProblemDisplay').textContent =
    state.currentProblemIndex + 1;
  updateProgress();
}

function updateProgress() {
  const progress = (state.currentProblemIndex / TOTAL_PROBLEMS) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;
  document.getElementById(
    'scoreDisplay'
  ).textContent = `Score: ${state.correctlySolved}/${state.currentProblemIndex}`;
}

// --- Interaction Functions ---

function checkAnswer() {
  const inputNum = document.getElementById('inputNum');
  const inputDen = document.getElementById('inputDen');
  const feedbackArea = document.getElementById('feedbackArea');
  const checkButton = document.getElementById('checkButton');

  const userAnswerNum = parseInt(inputNum.value.trim(), 10);
  const userAnswerDen = parseInt(inputDen.value.trim(), 10);

  if (isNaN(userAnswerNum) || isNaN(userAnswerDen) || userAnswerDen === 0) {
    feedbackArea.textContent =
      'Please enter valid, non-zero numbers for the numerator and denominator.';
    feedbackArea.className = 'feedback-item feedback-incorrect';
    feedbackArea.classList.remove('hidden');
    return;
  }

  const correct = state.currentProblem.answer;
  const userSimplified = simplifyFraction(userAnswerNum, userAnswerDen);

  const isCorrect =
    userSimplified.num === correct.num && userSimplified.den === correct.den;

  if (isCorrect) {
    state.correctlySolved++;
    state.currentProblemIndex++;

    feedbackArea.innerHTML =
      '<strong>Correct! ✅</strong> Well done! Moving to the next problem in 2 seconds...';
    feedbackArea.className = 'feedback-item feedback-correct';
    feedbackArea.classList.remove('hidden');

    inputNum.disabled = true;
    inputDen.disabled = true;
    checkButton.disabled = true;

    setTimeout(nextProblem, 2000);
  } else {
    state.attemptCounters++;
    const attemptsLeft = MAX_ATTEMPTS - state.attemptCounters;

    if (attemptsLeft > 0) {
      feedbackArea.innerHTML = `<strong>Incorrect. ❌</strong> Please try again. Attempts remaining: ${attemptsLeft}.`;
      feedbackArea.className = 'feedback-item feedback-incorrect';
    } else {
      state.currentProblemIndex++;

      feedbackArea.innerHTML = `
              <strong>Maximum attempts reached.</strong> The simplified answer is: 
              <span style="font-size: 1.5rem; font-weight: 700; color: var(--color-math-orange);">${correct.num} / ${correct.den}</span>.
              Moving to the next problem in 5 seconds... 😥
            `;
      feedbackArea.className = 'feedback-item feedback-failed';

      inputNum.disabled = true;
      inputDen.disabled = true;
      checkButton.disabled = true;

      setTimeout(nextProblem, 5000);
    }
    feedbackArea.classList.remove('hidden');
  }
}

// --- Initialization ---
window.onload = function () {
  nextProblem();
};
