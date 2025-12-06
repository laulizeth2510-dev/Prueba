// --- Configuración y Estado ---
const NUM_WHEELS = 6; // Número de ruedas/dígitos
// Mapeo de índices (de derecha a izquierda, menor a mayor valor):
// 0: Milésimas (0.001), 1: Centésimas (0.01), 2: Décimas (0.1), 3: Unidades (1), 4: Decenas (10), 5: Centenas (100)
let wheelValues = Array(NUM_WHEELS).fill(0); // Valor de cada rueda (0-9). Almacena el acumulado.
// [currentRotation (visual), targetRotation (meta)] en grados
let wheelRotations = Array(NUM_WHEELS)
  .fill()
  .map(() => [0, 0]);
// Estado para los engranajes de acarreo: [currentRotation, targetRotation]
let carryRotations = Array(NUM_WHEELS - 1)
  .fill()
  .map(() => [0, 0]);

const ROTATION_PER_UNIT = 36; // 360 grados / 10 dígitos
const GEAR_SIZE = 130;
const ANIMATION_DURATION = 350;
const COLUMN_WIDTH_PLUS_GAP = 133; // Ancho de columna (130) + margen (3)
const CARRY_TOOTH_INDEX = 5; // Diente largo en la posición 5 del engranaje de acarreo

// --- DOM Elements ---
const pascalineContainer = document.getElementById('pascalineContainer');
const totalDisplay = document.getElementById('totalDisplay');

// Mapa para rastrear los IDs de los frames de animación
let animationFrames = {};
let carryAnimationFrames = {};

// --- Utilidades SVG ---

/**
 * Genera el SVG de un engranaje, incluyendo los dígitos en su superficie si es el principal.
 */
function createGearSVG(id, rotation, isCarryGear = false) {
  const teeth = 10;
  const size = GEAR_SIZE;
  const color = isCarryGear ? '#BCAAA4' : '#FFD700';
  const strokeColor = isCarryGear ? '#795548' : '#A0522D';

  const toothAngle = 360 / teeth;

  const toothWidth = 5;
  const toothHeight = 10;
  const longToothHeight = 25;

  const radius = size / 2 - 5;
  const centerX = size / 2;
  const centerY = size / 2;

  const textRadius = radius - 20;
  const DIGIT_VERTICAL_SHIFT = 0;
  const textOrbitCenterY = centerY + DIGIT_VERTICAL_SHIFT;
  const VERTICAL_OFFSET_FOR_CENTERING = -2;
  const FONT_SIZE = 18;
  const AXLE_RADIUS = 2.5;

  let markup = `
                <svg class="gear-svg ${
                  isCarryGear ? 'carry-gear' : 'main-gear'
                }" 
                     id="${id}" 
                     width="${size}" height="${size}" 
                     viewBox="0 0 ${size} ${size}" 
                     style="transform: rotate(${rotation}deg);"> 
                    
                    <!-- Círculo principal del engranaje -->
                    <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" stroke="${strokeColor}" stroke-width="2"/>
                    <!-- Eje central -->
                    <circle cx="${centerX}" cy="${centerY}" r="${AXLE_RADIUS}" fill="#333" stroke="#333" stroke-width="2"/>
                    
                    <!-- Dientes de Engranaje (Rectángulos simples) -->
                    ${[...Array(teeth).keys()]
                      .map((j) => {
                        const isLongTooth =
                          isCarryGear && j === CARRY_TOOTH_INDEX;
                        const height = isLongTooth
                          ? longToothHeight
                          : toothHeight;

                        return `
                            <rect x="${centerX - toothWidth / 2}" y="${
                          centerY - radius
                        }" 
                                width="${toothWidth}" 
                                height="${height}" 
                                fill="${strokeColor}" 
                                rx="1" ry="1"
                                transform="translate(${centerX}, ${centerY}) rotate(${
                          j * toothAngle
                        }) translate(-${centerX}, -${centerY})"/>
                        `;
                      })
                      .join('')}
                    
                    <!-- DIGITOS EN LA RUEDA (Solo si no es engranaje de acarreo) -->
                    ${
                      isCarryGear
                        ? ''
                        : [...Array(teeth).keys()]
                            .map((d) => {
                              const PLACEMENT_ANGLE_ZERO = 270;
                              const displayAngleDeg =
                                PLACEMENT_ANGLE_ZERO - d * ROTATION_PER_UNIT;
                              const angleRad =
                                displayAngleDeg * (Math.PI / 180);

                              const textX =
                                centerX + textRadius * Math.cos(angleRad);
                              const textY =
                                textOrbitCenterY +
                                textRadius * Math.sin(angleRad);

                              const rotationCompensation = -rotation;

                              return `
                            <text x="${textX}" y="${
                                textY + VERTICAL_OFFSET_FOR_CENTERING
                              }" 
                                text-anchor="middle" 
                                dominant-baseline="middle" 
                                fill="#1F2937" 
                                font-size="${FONT_SIZE}" 
                                font-weight="bold"
                                transform="rotate(${rotationCompensation}, ${textX}, ${
                                textY + VERTICAL_OFFSET_FOR_CENTERING
                              })">
                                ${d}
                            </text>
                        `;
                            })
                            .join('')
                    }
                </svg>
            `;
  return markup;
}

/**
 * Actualiza el display de lectura digital de una columna específica.
 */
function updateColumnDisplay(index) {
  const displayElement = document.getElementById(`value-display-${index}`);
  if (displayElement) {
    // El valor visible es el acumulado modulo 10
    const visibleDigit = wheelValues[index] % 10;
    displayElement.textContent = visibleDigit;
  }
}

/**
 * Inicializa la estructura de la Pascalina.
 */
function initializeWheels() {
  // Cancelar animaciones antes de reiniciar el DOM
  Object.values(animationFrames).forEach((frameId) =>
    cancelAnimationFrame(frameId)
  );
  Object.values(carryAnimationFrames).forEach((frameId) =>
    cancelAnimationFrame(frameId)
  );
  animationFrames = {};
  carryAnimationFrames = {};

  pascalineContainer.innerHTML = '';

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'flex relative';

  // Mapeo de valores de posición para el botón:
  const positionValues = [
    '+0,001 (Milésimas)',
    '+0,01 (Centésimas)',
    '+0,1 (Décimas)',
    '+1 (Unidades)',
    '+10 (Decenas)',
    '+100 (Centenas)',
  ];

  // 1. Renderiza las ruedas de izquierda (mayor valor, Centenas) a derecha (menor valor, Milésimas)
  for (let i = NUM_WHEELS - 1; i >= 0; i--) {
    // --- Separador Decimal (entre Unidades i=3 y Décimas i=2) ---
    if (i === 2) {
      const separator = document.createElement('div');
      separator.className = 'decimal-separator';
      separator.innerHTML = `
                        <!-- Placeholder para igualar el espacio del botón y engranaje (aprox 172px) -->
                        <div style="height: 172px; width: 100%;"></div> 
                        
                        <!-- El contenedor del punto/coma, con la misma altura que la caja negra (44px) -->
                        <div class="decimal-point-container">
                            <span class="decimal-point-text">,</span> 
                        </div>
                    `;
      columnsContainer.appendChild(separator);
    }

    const column = document.createElement('div');
    column.className = 'digit-column';

    // --- Contenedor del Sistema de Engranajes ---
    const gearSystem = document.createElement('div');
    gearSystem.id = `gear-system-${i}`;
    gearSystem.className = 'gear-system';

    // Generar Engranaje Principal (con dígitos)
    const initialVisualRotation = 180;
    wheelRotations[i][0] = initialVisualRotation;
    wheelRotations[i][1] = initialVisualRotation;

    const mainGear = createGearSVG(`main-gear-${i}`, wheelRotations[i][0]);
    gearSystem.innerHTML += mainGear;
    column.appendChild(gearSystem);

    // --- Indicador de lectura fijo (punto rojo) ---
    const readingDot = document.createElement('div');
    readingDot.className = 'fixed-reading-dot';
    column.appendChild(readingDot);

    // --- Botón de Incremento (VERDE) ---
    const button = document.createElement('button');
    button.className =
      'increment-button bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md';

    button.textContent = positionValues[i];
    button.onclick = () => addUnit(i, 1);
    column.appendChild(button);

    // --- Display de Valor Actual (NEGRO) ---
    const valueDisplay = document.createElement('div');
    valueDisplay.id = `value-display-${i}`;
    valueDisplay.className = 'current-value-display';

    // Asegurar que el valor inicial '0' se muestre
    valueDisplay.textContent = (wheelValues[i] % 10).toString();

    column.appendChild(valueDisplay);

    // --- Indicador de Acarreo ---
    const carryIndicator = document.createElement('span');
    carryIndicator.id = `carry-${i}`;
    carryIndicator.className = 'carry-indicator';
    carryIndicator.textContent = 'ACARREO';
    column.appendChild(carryIndicator);

    columnsContainer.appendChild(column);

    // 2. Insertar Engranaje de Acarreo (gris)
    if (i > 0) {
      const carryIndex = i - 1;
      const halfGearSize = GEAR_SIZE / 2;
      const gapWidth = COLUMN_WIDTH_PLUS_GAP - GEAR_SIZE;

      const carryGearWrapper = document.createElement('div');
      carryGearWrapper.id = `carry-gear-wrapper-${carryIndex}`;
      carryGearWrapper.className = 'carry-gear-wrapper';

      const numColumnsLeft = NUM_WHEELS - i;
      const startOfGap = numColumnsLeft * COLUMN_WIDTH_PLUS_GAP - gapWidth;
      const centerOfGap = startOfGap + gapWidth / 2;
      let carryGearLeft = centerOfGap - halfGearSize;

      const SHIFT_LEFT = 4;
      carryGearLeft -= SHIFT_LEFT;
      
      // Ajuste por el separador decimal (ancho aprox 18px)
      const SEPARATOR_WIDTH = 18; 
      if (carryIndex < 2) {
         carryGearLeft += SEPARATOR_WIDTH;
      } else if (carryIndex === 2) {
         carryGearLeft += SEPARATOR_WIDTH / 2;
      }

      const carryGearSVG = createGearSVG(
        `carry-gear-${carryIndex}`,
        carryRotations[carryIndex][0],
        true
      );
      carryGearWrapper.innerHTML = carryGearSVG;

      carryGearWrapper.style.left = `${carryGearLeft}px`;

      // FIX: Append to columnsContainer so they move with the flex layout
      columnsContainer.appendChild(carryGearWrapper);
    }
  }

  pascalineContainer.appendChild(columnsContainer);
}

// --- Lógica de Animación y Funciones ---

/**
 * Anima la rotación de un engranaje principal (y sus dígitos).
 */
function animateRotation(index, startTime) {
  const startRotation = wheelRotations[index][0];
  const targetRotation = wheelRotations[index][1];
  const elapsedTime = performance.now() - startTime;

  let progress = Math.min(1, elapsedTime / ANIMATION_DURATION);

  progress =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 4) / 2;

  const currentRotation =
    startRotation + (targetRotation - startRotation) * progress;
  wheelRotations[index][0] = currentRotation;

  // 1. Actualiza la rotación del SVG principal
  const gearElement = document.getElementById(`main-gear-${index}`);
  if (gearElement) {
    gearElement.style.transform = `rotate(${currentRotation}deg)`;

    // 2. Actualiza la rotación compensatoria de los dígitos
    const textElements = gearElement.querySelectorAll('text');
    const rotationCompensation = -currentRotation;
    const VERTICAL_OFFSET_FOR_CENTERING = -2;

    textElements.forEach((text) => {
      const x = parseFloat(text.getAttribute('x'));
      const y = parseFloat(text.getAttribute('y'));
      text.setAttribute(
        'transform',
        `rotate(${rotationCompensation}, ${x}, ${y})`
      );
    });
  }

  if (elapsedTime < ANIMATION_DURATION) {
    animationFrames[index] = requestAnimationFrame(() =>
      animateRotation(index, startTime)
    );
  } else {
    // Finaliza la animación y establece la rotación final
    wheelRotations[index][0] = targetRotation;
    delete animationFrames[index];

    // Asegurar el renderizado final
    if (gearElement) {
      gearElement.style.transform = `rotate(${targetRotation}deg)`;
      const textElements = gearElement.querySelectorAll('text');
      const finalRotationCompensation = -targetRotation;
      const VERTICAL_OFFSET_FOR_CENTERING = -2;
      textElements.forEach((text) => {
        const x = parseFloat(text.getAttribute('x'));
        const y = parseFloat(text.getAttribute('y'));
        text.setAttribute(
          'transform',
          `rotate(${finalRotationCompensation}, ${x}, ${y})`
        );
      });
    }
  }
}

/**
 * Anima la rotación de un engranaje de acarreo.
 */
function animateCarryGear(index, startTime) {
  const startRotation = carryRotations[index][0];
  const targetRotation = carryRotations[index][1];
  const elapsedTime = performance.now() - startTime;

  let progress = Math.min(1, elapsedTime / ANIMATION_DURATION);

  progress =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 4) / 2;

  const currentRotation =
    startRotation + (targetRotation - startRotation) * progress;
  carryRotations[index][0] = currentRotation;

  const carryGearElement = document.getElementById(`carry-gear-${index}`);
  if (carryGearElement) {
    carryGearElement.style.transform = `rotate(${currentRotation}deg)`;
  }

  if (elapsedTime < ANIMATION_DURATION) {
    carryAnimationFrames[index] = requestAnimationFrame(() =>
      animateCarryGear(index, startTime)
    );
  } else {
    carryRotations[index][0] = targetRotation;
    delete carryAnimationFrames[index];

    if (carryGearElement) {
      carryGearElement.style.transform = `rotate(${targetRotation}deg)`;
    }
  }
}

/**
 * Muestra una animación de acarreo en el indicador.
 */
function triggerCarryAnimation(index) {
  const receiverIndex = index + 1;
  if (receiverIndex < NUM_WHEELS) {
    const carryIndicator = document.getElementById(`carry-${receiverIndex}`);
    if (carryIndicator) {
      carryIndicator.classList.add('carry-active');
      setTimeout(() => {
        carryIndicator.classList.remove('carry-active');
      }, 800);
    }
  }
}

/**
 * Maneja la adición de una unidad al índice de rueda especificado e implementa el acarreo.
 */
function addUnit(index, value = 1) {
  if (index >= NUM_WHEELS || index < 0) return;

  // 1. Aplica la rotación visual al engranaje principal
  const rotationChange = value * ROTATION_PER_UNIT;
  wheelRotations[index][1] += rotationChange;

  // 2. Comprueba si se va a producir un acarreo ANTES de cambiar el dígito.
  const currentValue = wheelValues[index] % 10;
  const willCarry = currentValue === 9 && value === 1;

  // 3. Añade el valor al dígito de la rueda actual (acumulado)
  wheelValues[index] += value;

  // 4. Inicia la animación de rotación del engranaje principal
  if (!animationFrames[index]) {
    animateRotation(index, performance.now());
  }

  // LÓGICA DE ACOPLAMIENTO (Mover Engranaje Gris)
  if (index < NUM_WHEELS - 1) {
    const carryGearIndex = index;
    carryRotations[carryGearIndex][1] -= rotationChange;

    if (!carryAnimationFrames[carryGearIndex]) {
      carryRotations[carryGearIndex][0] =
        carryRotations[carryGearIndex][0] || 0;
      animateCarryGear(carryGearIndex, performance.now());
    }
  }

  // 5. Lógica del Engranaje de Acarreo (para el acarreo real 9->0)
  if (willCarry) {
    triggerCarryAnimation(index);
    addUnit(index + 1, 1);
  }

  // 6. Actualiza el total y el display de la columna actual
  updateTotalDisplay();
  updateColumnDisplay(index);
}

/**
 * Calcula el valor total de las ruedas y lo muestra, ahora con tres decimales (milésimas).
 */
function updateTotalDisplay() {
  // Mapeo de índices (Centenas a Milésimas): 5 4 3 , 2 1 0

  // 1. Construye la parte entera (R5 R4 R3)
  let integerPartStr = '';
  for (let i = NUM_WHEELS - 1; i >= 3; i--) {
    // Usa el valor del dígito actual (módulo 10)
    integerPartStr += (wheelValues[i] % 10).toString();
  }

  // 2. Construye la parte decimal (R2 R1 R0)
  let decimalPartStr = '';
  for (let i = 2; i >= 0; i--) {
    decimalPartStr += (wheelValues[i] % 10).toString();
  }

  // Convertir la parte entera a número para formato de miles
  let integerValue = parseInt(integerPartStr || '0', 10);

  // Formatear la parte entera usando el estándar 'es-ES' (punto como separador de miles)
  let formattedInteger = integerValue.toLocaleString('es-ES', {
    minimumIntegerDigits: 1,
    useGrouping: true,
  });

  // 3. Combinar con el separador decimal (coma para es-ES)
  let paddedDecimalPart = decimalPartStr.padEnd(3, '0').slice(0, 3);
  let totalString = `${formattedInteger},${paddedDecimalPart}`;

  totalDisplay.textContent = totalString;
}

/**
 * Restablece la Pascalina a cero.
 */
function clearPascaline() {
  wheelValues = Array(NUM_WHEELS).fill(0);

  // Restablecer rotaciones a la posición inicial (180 grados)
  const initialVisualRotation = 180;
  wheelRotations = Array(NUM_WHEELS)
    .fill()
    .map(() => [initialVisualRotation, initialVisualRotation]);
  carryRotations = Array(NUM_WHEELS - 1)
    .fill()
    .map(() => [0, 0]);

  // Reinicializa la estructura, lo que recrea los elementos y establece los '0'
  initializeWheels();
  updateTotalDisplay();
}

// --- Inicialización ---
window.onload = function () {
  // Establece las rotaciones iniciales antes de la inicialización completa
  const initialVisualRotation = 180;
  wheelRotations = Array(NUM_WHEELS)
    .fill()
    .map(() => [initialVisualRotation, initialVisualRotation]);

  initializeWheels();
  updateTotalDisplay();
};
