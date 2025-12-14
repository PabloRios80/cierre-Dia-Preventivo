document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS PRINCIPALES ---
    const unauthorizedMessage = document.getElementById('unauthorized-message');
    const mainContent = document.getElementById('main-content');
    
    // --- ELEMENTOS DE IDENTIFICACIÓN ---
    const dniInput = document.getElementById('paciente-dni');
    const cargarDatosBtn = document.getElementById('cargar-datos-btn');
    const patientInfoDisplay = document.getElementById('patient-info-display');
    const dniDisplayInput = document.getElementById('dni-input');
    const efectorInput = document.getElementById('efector-input');
    const pacienteApellidoInput = document.getElementById('paciente-apellido');
    const pacienteNombreInput = document.getElementById('paciente-nombre');
    const pacienteEdadInput = document.getElementById('paciente-edad');
    const pacienteSexoSelect = document.getElementById('paciente-sexo');
    const fechaCierreInput = document.getElementById('fecha-cierre-input');
    const profesionalInput = document.getElementById('profesional-input');
    
    // --- ELEMENTOS DEL FORMULARIO DINÁMICO ---
    const cierreForm = document.getElementById('cierre-pediatria-form'); 
    const formStepsContainer = document.getElementById('form-steps-container');
    const progressBar = document.getElementById('progress-bar');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const guardarCierreBtn = document.getElementById('guardar-cierre-btn');
    const cancelarCierreBtn = document.getElementById('cancelar-cierre-btn');

    // --- ELEMENTOS DEL MODAL ---
    const estudiosModal = document.getElementById('estudiosModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCloseButtonBottom = document.getElementById('modalCloseButtonBottom');
    const modalDNI = document.getElementById('modalDNI');
    const estudiosModalContent = document.getElementById('estudiosModalContent');

    // --- ESTADO GLOBAL ---
    let currentPatientDNI = null; // Almacena el DNI del paciente actual
    let currentStep = 0; // Para el formulario multi-paso
    let formSteps = []; // Almacenará los divs de cada paso

    // --- DEFINICIÓN DE CAMPOS PEDIÁTRICOS (adaptados de tu lista) ---
    // NOTA: Los campos que son solo de texto/número no tienen options.
    // Los campos con (X/Y) se definen como select.
    const fieldsConfig = [
        // --- SECCIÓN 1: HÁBITOS, RIESGOS Y GENERAL ---
        { name: 'Presión Arterial', label: 'Presión Arterial', type: 'select', options: ['Control Normal', 'Hipertension'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-heartbeat' },
        { name: 'Observaciones - Presión Arterial', label: 'Obs. Presión Arterial', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'IMC', label: 'IMC', type: 'select', options: ['Bajo Peso', 'Control Normal', 'Sobrepeso', 'Obesidad', 'Obesidad Morbida'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-weight' },
        { name: 'Observaciones - IMC', label: 'Obs. IMC', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Alimentación saludable', label: 'Alimentación saludable', type: 'select', options: ['No', 'Si'], required: true, icon: 'fas fa-apple-alt' },
        { name: 'Observaciones - Alimentación saludable', label: 'Obs. Alimentación saludable', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Actividad física', label: 'Actividad física', type: 'select', options: ['No realiza', 'Si realiza'], required: true, icon: 'fas fa-running' },
        { name: 'Observaciones - Actividad física', label: 'Obs. Actividad física', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Seguridad vial', label: 'Seguridad vial', type: 'select', options: ['Cumple', 'No cumple'], required: true, icon: 'fas fa-car' },
        { name: 'Observaciones - Seguridad vial', label: 'Obs. Seguridad vial', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Tabaco', label: 'Tabaco', type: 'select', options: ['Fuma', 'No fuma'], required: true, icon: 'fas fa-smoking' },
        { name: 'Observaciones - Tabaco', label: 'Obs. Tabaco', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Violencia', label: 'Violencia', type: 'select', options: ['No se verifica', 'Se verifica'], required: true, icon: 'fas fa-hand-rock' },
        { name: 'Observaciones - Violencia', label: 'Obs. Violencia', type: 'textarea', required: false, icon: 'fas fa-comment' },
        // --- SECCIÓN 2: EXAMEN FÍSICO Y SENTIDOS ---
        { name: 'Examen Fisico', label: 'Examen Fisico', type: 'select', options: ['Control Normal', 'Con Observaciones'], required: true, icon: 'fas fa-user-md' },
        { name: 'Observaciones - Examen Fisico', label: 'Obs. Examen Fisico', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Talla', label: 'Talla', type: 'select', options: ['Alta', 'Baja', 'Control Normal'], required: true, icon: 'fas fa-ruler-vertical' },
        { name: 'Observaciones - Talla', label: 'Obs. Talla', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Salud Ocular', label: 'Salud Ocular', type: 'select', options: ['Alterada', 'Control Normal'], required: true, icon: 'fas fa-eye' },
        { name: 'Observaciones - Salud Ocular', label: 'Obs. Salud Ocular', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Audición', label: 'Audición', type: 'select', options: ['Alterada', 'Control Normal'], required: true, icon: 'fas fa-ear-listen' },
        { name: 'Observaciones - Audición', label: 'Obs. Audición', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Salud Cardiovascular', label: 'Salud Cardiovascular', type: 'select', options: ['Control Normal', 'Con Observaciones'], required: true, icon: 'fas fa-heart' },
        { name: 'Observaciones - Salud Cardiovascular', label: 'Obs. Salud Cardiovascular', type: 'textarea', required: false, icon: 'fas fa-comment' },
        // --- SECCIÓN 3: SALUD MENTAL, ESCOLAR, VPH Y PANTALLAS ---
        { name: 'Educación sexual', label: 'Educación sexual', type: 'select', options: ['Consejeria', 'Con Observaciones'], required: true, icon: 'fas fa-venus-mars' },
        { name: 'Observaciones - Educación sexual', label: 'Obs. Educación sexual', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Salud Mental Integral', label: 'Salud Mental Integral', type: 'select', options: ['Consejeria', 'Con Observaciones'], required: true, icon: 'fas fa-brain' },
        { name: 'Observaciones - Salud Mental', label: 'Obs. Salud Mental', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Consumo de sustancias problemáticas', label: 'Consumo de sustancias problemáticas', type: 'select', options: ['No aplica', 'Presenta', 'No presenta'], required: true, icon: 'fas fa-syringe' },
        { name: 'Observaciones - Consumo de sustancias', label: 'Obs. Consumo de sustancias', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Pesquisa de Dislipemia', label: 'Pesquisa de Dislipemia', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-blood-drop' },
        { name: 'Observaciones - Dislipemia', label: 'Obs. Dislipemia', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Síndrome Metabólico', label: 'Síndrome Metabólico', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], required: true, icon: 'fas fa-thermometer-half' },
        { name: 'Observaciones - Síndrome Metabólico', label: 'Obs. Síndrome Metabólico', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Escoliosis', label: 'Escoliosis', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], required: true, icon: 'fas fa-shoe-prints' },
        { name: 'Observaciones - Escoliosis', label: 'Obs. Escoliosis', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cáncer cérvico uterino', label: 'Cáncer cérvico uterino', type: 'select', options: ['No aplica', 'No tiene vacuna VPH', 'Tiene vacuna VPH'], required: true, icon: 'fas fa-dna' },
        { name: 'Observaciones - Cáncer cérvico uterino', label: 'Obs. Cáncer cérvico uterino', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cáncer de piel', label: 'Cáncer de piel', type: 'select', options: ['Consejeria', 'Derivacion a especialista'], required: true, icon: 'fas fa-sun' },
        { name: 'Observaciones - Cáncer de piel', label: 'Obs. Cáncer de piel', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Desarrollo escolar y aprendizaje', label: 'Desarrollo escolar y aprendizaje', type: 'select', options: ['Acorde a edad', 'No acorde a edad', 'No aplica'], required: true, icon: 'fas fa-school' },
        { name: 'Observaciones - Desarrollo escolar', label: 'Obs. Desarrollo escolar', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Uso de pantallas', label: 'Uso de pantallas', type: 'select', options: ['Si', 'No'], required: true, icon: 'fas fa-mobile-alt' },
        { name: 'Cantidad de horas diarias', label: 'Cantidad de horas diarias', type: 'text', required: false, icon: 'fas fa-clock' },
        { name: 'Observaciones - Uso de pantallas', label: 'Obs. Uso de pantallas', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Control de vacunas de calendario', label: 'Control de vacunas de calendario', type: 'select', options: ['Completo', 'Incompleto'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-syringe' },
        { name: 'Observaciones - Vacunas', label: 'Obs. Vacunas', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Control Odontológico - Niños', label: 'Control Odontológico - Niños', type: 'select', options: ['Control Normal', 'Riesgo Alto', 'Riesgo Bajo', 'Riesgo Moderado', 'No aplica'], hasStudyButton: true, studyType: 'Odontologia', required: true, icon: 'fas fa-tooth' },
        { name: 'Observaciones - Control Odontológico', label: 'Obs. Control Odontológico', type: 'textarea', required: false, icon: 'fas fa-comment' },
    ];


    // --- FUNCIONES DE UTILIDAD ---

    /**
     * Verifica el estado de autenticación del usuario.
     */
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();

            if (data.isLoggedIn) {
                mainContent.classList.remove('hidden');
                unauthorizedMessage.classList.add('hidden');
                // Asigna el nombre del profesional al campo oculto para enviarlo con el formulario
                profesionalInput.value = data.user.name;
                console.log('Usuario autenticado:', data.user.name);
            } else {
                mainContent.classList.add('hidden');
                unauthorizedMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            mainContent.classList.add('hidden');
            unauthorizedMessage.classList.remove('hidden');
        }
    }
    
    // Función para generar los pasos del formulario dinámicamente
    function generateFormSteps() {
        formStepsContainer.innerHTML = ''; 
        formSteps = []; 
        let stepDiv;
        let fieldCounter = 0;
        const fieldsPerStep = 4; // Mantenemos 2 pares (4 campos) por paso para un buen flujo.

        fieldsConfig.forEach(field => {
            if (fieldCounter % fieldsPerStep === 0) { // Crear un nuevo paso
                stepDiv = document.createElement('div');
                stepDiv.className = 'form-step grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-lg shadow-inner border border-blue-100 hidden'; 
                formStepsContainer.appendChild(stepDiv);
                formSteps.push(stepDiv);
            }

            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'mb-4';
            
            // Crea la etiqueta con el icono
            const label = document.createElement('label');
            label.htmlFor = field.name.replace(/\s/g, '_'); // Usa nombre normalizado para ID/for
            label.className = 'block text-gray-700 text-sm font-bold mb-2 flex items-center';
            if (field.icon) {
                const icon = document.createElement('i');
                icon.className = `${field.icon} mr-2 text-blue-600`;
                label.appendChild(icon);
            }
            label.appendChild(document.createTextNode(field.label + ':'));

            let inputElement;
            const inputClasses = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
            const fieldNameNormalized = field.name.replace(/\s/g, '_').replace(/-/g, '_').replace(/[\(\)]/g, ''); // Normalización

            if (field.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.className = inputClasses;
                inputElement.id = fieldNameNormalized;
                inputElement.name = fieldNameNormalized;
                inputElement.required = field.required !== false;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                inputElement.appendChild(defaultOption);

                field.options.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText;
                    option.textContent = optionText;
                    inputElement.appendChild(option);
                });
            } else if (field.type === 'textarea') {
                inputElement = document.createElement('textarea');
                inputElement.className = `${inputClasses} h-20 resize-y`;
                inputElement.id = fieldNameNormalized;
                inputElement.name = fieldNameNormalized;
                inputElement.required = field.required !== false;
            } else { // type 'text' o 'date' o 'number'
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.className = inputClasses;
                inputElement.id = fieldNameNormalized;
                inputElement.name = fieldNameNormalized;
                inputElement.required = field.required !== false;
            }

            fieldContainer.appendChild(label);

            // Lógica para botones "Ver Estudio"
            if (field.hasStudyButton) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'flex items-center';
                inputGroup.appendChild(inputElement);

                const studyButton = document.createElement('button');
                studyButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r ml-2 focus:outline-none focus:shadow-outline flex-shrink-0 text-sm';
                studyButton.innerHTML = `<i class="fas fa-search mr-1"></i>Ver Estudio`;
                studyButton.title = `Ver Estudio de ${field.label}`;
                studyButton.dataset.studyType = field.studyType;
                studyButton.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    if (currentPatientDNI) {
                        mostrarEstudiosModal(currentPatientDNI, studyButton.dataset.studyType);
                    } else {
                        alert('DNI del paciente no disponible para ver estudios.');
                    }
                });  

                inputGroup.appendChild(studyButton);
                fieldContainer.appendChild(inputGroup);
            } else {
                fieldContainer.appendChild(inputElement);
            }

            stepDiv.appendChild(fieldContainer);
            fieldCounter++;
        });
        showStep(0); // Mostrar el primer paso al generar
    }

    // Función para mostrar un paso específico
    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.add('hidden');
            if (index === stepIndex) {
                step.classList.remove('hidden');
            }
        });

        currentStep = stepIndex;
        updateProgressBar();
        updateNavigationButtons();
    }

    // Función para actualizar la barra de progreso
    function updateProgressBar() {
        const progress = formSteps.length === 0 ? 0 : ((currentStep + 1) / formSteps.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // Función para actualizar la visibilidad de los botones de navegación
    function updateNavigationButtons() {
        if (currentStep === 0) {
            prevStepBtn.classList.add('hidden');
        } else {
            prevStepBtn.classList.remove('hidden');
        }

        if (currentStep === formSteps.length - 1) {
            nextStepBtn.classList.add('hidden');
            guardarCierreBtn.classList.remove('hidden'); 
        } else {
            nextStepBtn.classList.remove('hidden');
            guardarCierreBtn.classList.add('hidden'); 
        }
    }

    // Función para limpiar el formulario y resetear el estado
    function resetForm() {
        dniInput.value = '';
        dniDisplayInput.value = '';
        efectorInput.value = '';
        pacienteApellidoInput.value = '';
        pacienteNombreInput.value = '';
        pacienteEdadInput.value = '';
        pacienteSexoSelect.value = '';
        fechaCierreInput.value = new Date().toISOString().split('T')[0]; // Resetear a fecha actual
        profesionalInput.value = ''; // Se actualizará en checkAuthStatus

        patientInfoDisplay.classList.add('hidden');
        cierreForm.classList.add('hidden');
        formStepsContainer.innerHTML = ''; 
        currentStep = 0;
        formSteps = [];
        updateProgressBar();
        currentPatientDNI = null;

        // Deshabilitar botón de carga hasta que se ingrese DNI
        cargarDatosBtn.disabled = true; 
    }

    /**
     * Muestra el modal con los estudios complementarios.
     * @param {string} dni DNI del paciente.
     * @param {string} studyType Tipo de estudio a buscar (e.g., 'Laboratorio', 'Odontologia').
     */
    async function mostrarEstudiosModal(dni, studyType) {
        estudiosModalContent.innerHTML = '<p class="text-center text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Buscando estudios de ' + studyType + '...</p>';
        modalDNI.textContent = dni;
        estudiosModal.style.display = 'block';

        try {
            // Llama al endpoint del servidor para buscar estudios
            const response = await fetch(`/api/estudios/${dni}/${studyType}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                let html = `<p class="text-green-600 font-semibold mb-3">Estudios encontrados (${result.data.length}):</p>`;
                
                result.data.forEach((study, index) => {
                    html += `<div class="p-3 mb-3 border border-gray-200 rounded-md bg-white shadow-sm">`;
                    html += `<h4 class="font-bold text-blue-700 border-b pb-1 mb-2">Resultado #${index + 1}</h4>`;
                    
                    // Mostrar los campos del estudio como una lista
                    Object.entries(study).forEach(([key, value]) => {
                        html += `<p><span class="font-medium text-gray-800">${key}:</span> ${value || 'N/A'}</p>`;
                    });
                    html += `</div>`;
                });
                estudiosModalContent.innerHTML = html;
            } else if (result.success && result.data.length === 0) {
                estudiosModalContent.innerHTML = `<p class="text-center text-gray-600 p-4 bg-yellow-50 rounded-md">No se encontraron estudios de ${studyType} para el DNI ${dni}.</p>`;
            } else {
                throw new Error(result.error || 'Error desconocido del servidor.');
            }

        } catch (error) {
            console.error('Error al obtener estudios:', error);
            estudiosModalContent.innerHTML = `<p class="text-center text-red-600 p-4 bg-red-50 rounded-md"><i class="fas fa-exclamation-circle mr-2"></i>Error al cargar estudios: ${error.message}</p>`;
        }
    }

    // --- LÓGICA DE EVENTOS ---
    
    // Inicialización al cargar la página
    checkAuthStatus();
    fechaCierreInput.value = new Date().toISOString().split('T')[0]; // Setear fecha actual por defecto

    // Habilitar el botón Cargar Datos
    dniInput.addEventListener('input', () => {
        if (dniInput.value.trim().length > 0) {
            cargarDatosBtn.disabled = false;
        } else {
            cargarDatosBtn.disabled = true;
            resetForm(); 
        }
    });

    // Event Listener para el botón "Cargar Ficha"
    cargarDatosBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dni = dniInput.value.trim();
        if (!dni) return;
        
        // Cargar DNI en el campo de visualización y en el estado global
        dniDisplayInput.value = dni;
        currentPatientDNI = dni;

        // Mostrar campos fijos de paciente y el formulario dinámico
        patientInfoDisplay.classList.remove('hidden');
        cierreForm.classList.remove('hidden');

        // Generar y mostrar el primer paso del formulario dinámico
        generateFormSteps();
    });

    // Navegación Siguiente
    nextStepBtn.addEventListener('click', () => {
        const currentStepFields = formSteps[currentStep].querySelectorAll('input, select, textarea');
        let stepIsValid = true;
        currentStepFields.forEach(field => {
            // Validación de campos obligatorios
            if (field.required && !field.value.trim()) {
                field.classList.add('border-red-500', 'ring-red-500');
                stepIsValid = false;
            } else {
                field.classList.remove('border-red-500', 'ring-red-500');
            }
        });

        if (!stepIsValid) {
            alert('Por favor, complete todos los campos obligatorios antes de avanzar.');
            return;
        }

        if (currentStep < formSteps.length - 1) {
            showStep(currentStep + 1);
        }
    });

    // Navegación Anterior
    prevStepBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    });

    // Event Listener para el botón "Guardar Cierre"
    guardarCierreBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // 1. Recolectar y validar datos de campos fijos
        const fixedFields = [dniDisplayInput, efectorInput, pacienteApellidoInput, pacienteNombreInput, pacienteEdadInput, pacienteSexoSelect, fechaCierreInput, profesionalInput];
        let allFieldsValid = true;
        const formData = {};

        // Recolectar datos fijos y validar
        fixedFields.forEach(input => {
            if (input.required && !input.value.trim()) {
                allFieldsValid = false;
                input.classList.add('border-red-500', 'ring-red-500');
            } else {
                input.classList.remove('border-red-500', 'ring-red-500');
            }
            // Normalizar el nombre del campo para el backend
            let key = input.name;
            if (key === 'DNI') key = 'DNI';
            if (key === 'FECHA') key = 'FECHA';
            if (key === 'Edad') key = 'Edad';
            if (key === 'Sexo') key = 'Sexo';
            if (key === 'Efector') key = 'Efector';
            if (key === 'Profesional') key = 'Profesional';

            // El backend espera 'Apellido_Nombre' fusionado, lo creamos aquí
            if (input.id === 'paciente-apellido' || input.id === 'paciente-nombre') {
                formData['Apellido_Nombre'] = `${pacienteApellidoInput.value.trim()} ${pacienteNombreInput.value.trim()}`;
            } else {
                formData[key] = input.value.trim();
            }
        });


        // 2. Recolectar datos de campos dinámicos y validar
        const allDynamicInputs = cierreForm.querySelectorAll('.form-step input, .form-step select, .form-step textarea');
        allDynamicInputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                allFieldsValid = false;
                input.classList.add('border-red-500', 'ring-red-500'); 
            } else {
                input.classList.remove('border-red-500', 'ring-red-500');
            }
            formData[input.name] = input.value.trim();
        });

        if (!allFieldsValid) {
            alert('Por favor, complete todos los campos obligatorios del formulario. Revise los campos resaltados en rojo.');
            return;
        }

        guardarCierreBtn.disabled = true;
        guardarCierreBtn.textContent = 'Guardando...';

        try {
            // ************ RUTA CLAVE: Nueva ruta para pediatría ************
            const response = await fetch('/api/cierre-pediatria/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                resetForm(); 
            } else {
                alert(`Error al guardar: ${result.error || result.details}`);
            }
        } catch (error) {
            console.error('Error al guardar el formulario de cierre:', error);
            alert('Ocurrió un error de conexión al guardar el formulario. Intente nuevamente.');
        } finally {
            guardarCierreBtn.disabled = false;
            guardarCierreBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Cierre';
        }
    });

    // Event Listener para el botón "Cancelar"
    cancelarCierreBtn.addEventListener('click', () => {
        // Reemplazamos window.confirm por un mensaje más amigable
        if (confirm('¿Está seguro de que desea cancelar? Se perderán los cambios no guardados.')) {
            resetForm(); 
        }
    });

    // Eventos para cerrar el Modal
    closeModalBtn.addEventListener('click', () => estudiosModal.style.display = 'none');
    modalCloseButtonBottom.addEventListener('click', () => estudiosModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === estudiosModal) {
            estudiosModal.style.display = 'none';
        }
    });

});