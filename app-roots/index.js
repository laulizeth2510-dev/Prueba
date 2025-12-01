// --- Problem Definition and Correct Answers ---
// Note: Problems 'e' and 'j' have been adjusted to positive numbers (32 and 243)
// to comply with the requirement of "positive numbers only".
const problemsData = [
  { id: 'a', expression: '√144', correct: 12, label: 'a' },
  { id: 'b', expression: '³√343', correct: 7, label: 'b' },
  { id: 'c', expression: '⁴√16', correct: 2, label: 'c' },
  { id: 'd', expression: '⁴√625', correct: 5, label: 'd' },
  { id: 'e', expression: '⁵√32', correct: 2, label: 'e' },
  { id: 'f', expression: '⁵√100 000', correct: 10, label: 'f' },
  { id: 'g', expression: '⁴√6561', correct: 9, label: 'g' },
  { id: 'h', expression: '⁶√64', correct: 2, label: 'h' },
  { id: 'i', expression: '¹⁰√1024', correct: 2, label: 'i' },
  { id: 'j', expression: '⁵√243', correct: 3, label: 'j' },
];

const exerciseContainer = document.getElementById('exerciseContainer');
// Object to track failed attempts for each problem: { 'a': 0, 'b': 0, ... }
let attemptCounters = {};
const MAX_ATTEMPTS = 3;

/**
 * Checks the student's answer for a specific problem.
 * @param {string} problemId - The ID of the problem (e.g., 'a', 'b').
 * @param {number} correctAnswer - The expected correct answer.
 */
function checkAnswer(problemId, correctAnswer) {
  const inputElement = document.getElementById(`input-${problemId}`);
  const feedbackElement = document.getElementById(`feedback-${problemId}`);
  const checkButton = document.getElementById(`check-btn-${problemId}`);

  // Check if the input is disabled (already solved or max attempts reached)
  if (inputElement.disabled) {
    return;
  }

  const userAnswer = parseInt(inputElement.value.trim(), 10);

  // Clear the previous feedback class and prepare the element.
  feedbackElement.classList.remove(
    'feedback-correct',
    'feedback-incorrect',
    'feedback-failed',
    'hidden'
  );

  if (isNaN(userAnswer) || inputElement.value.trim() === '') {
    feedbackElement.innerHTML =
      '<span class="feedback-icon">⚠️</span>Please enter a number.';
    feedbackElement.classList.add('feedback-incorrect');
    feedbackElement.classList.remove('hidden');
    return;
  }

  if (userAnswer === correctAnswer) {
    // Correct Answer
    feedbackElement.innerHTML = '<span class="feedback-icon">✅</span>Correct!';
    feedbackElement.classList.add('feedback-correct');
    inputElement.disabled = true; // Disable input if correct
    checkButton.disabled = true; // Disable button
  } else {
    // Incorrect Answer

    // Increment the counter for this problem
    attemptCounters[problemId] = (attemptCounters[problemId] || 0) + 1;

    const attemptsLeft = MAX_ATTEMPTS - attemptCounters[problemId];

    if (attemptsLeft > 0) {
      // Try again
      feedbackElement.innerHTML = `<span class="feedback-icon">❌</span>Incorrect. Attempts remaining: ${attemptsLeft}`;
      feedbackElement.classList.add('feedback-incorrect');
    } else {
      // Max attempts reached: reveal the answer
      feedbackElement.innerHTML = `<span class="feedback-icon">📍</span>Maximum attempts reached. The correct answer is <strong>${correctAnswer}</strong>.`;
      feedbackElement.classList.add('feedback-failed');
      inputElement.disabled = true; // Disable input
      checkButton.disabled = true; // Disable button
    }
  }

  // Show the feedback element
  feedbackElement.classList.remove('hidden');
}

/**
 * Loads and renders all problems in the container.
 */
function loadExercise() {
  exerciseContainer.innerHTML = ''; // Clear the container
  attemptCounters = {}; // Reset all attempt counters

  problemsData.forEach((problem) => {
    // Initialize counter for this problem
    attemptCounters[problem.id] = 0;

    const problemCard = document.createElement('div');
    problemCard.className = 'problem-card';

    // Build HTML for each problem
    problemCard.innerHTML = `
            <div style="margin-bottom: 1rem;">
              <span class="problem-label">${problem.label}</span>
              <div class="problem-expression" style="margin-top: 0.75rem;">
                ${problem.expression}
              </div>
            </div>
            
            <div class="input-group">
              <input 
                type="number" 
                id="input-${problem.id}" 
                placeholder="Write your answer" 
                class="input-field"
              />
              <div style="display: flex; gap: 0.75rem;">
                <button 
                  id="check-btn-${problem.id}"
                  class="btn btn-check"
                  onclick="checkAnswer('${problem.id}', ${problem.correct})"
                >
                  Check
                </button>
              </div>
            </div>

            <!-- Feedback Container (initially empty/hidden) -->
            <div id="feedback-${problem.id}" class="feedback-item hidden">
              <!-- Feedback will be inserted here -->
            </div>
          `;

    exerciseContainer.appendChild(problemCard);
  });

  // Change the control button text
  document.getElementById('newExerciseButton').textContent = '🔄 New Exercise';
}

// --- Initialization ---
window.onload = loadExercise;
