document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES ---
    const unauthorizedMessage = document.getElementById('unauthorized-message');
    const mainContent = document.getElementById('main-content');
    
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
    
    const cierreForm = document.getElementById('cierre-pediatria-form'); 
    const formStepsContainer = document.getElementById('form-steps-container');
    const progressBar = document.getElementById('progress-bar');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const guardarCierreBtn = document.getElementById('guardar-cierre-btn');
    const cancelarCierreBtn = document.getElementById('cancelar-cierre-btn');

    const estudiosModal = document.getElementById('estudiosModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCloseButtonBottom = document.getElementById('modalCloseButtonBottom');
    const modalDNI = document.getElementById('modalDNI');
    const estudiosModalContent = document.getElementById('estudiosModalContent');

    let currentPatientDNI = null; 
    let currentStep = 0; 
    let formSteps = []; 

    // --- CONFIGURACIÓN DE CAMPOS ---
    const fieldsConfig = [
        // Paso 1
        { name: 'Presión Arterial', label: 'Presión Arterial', type: 'select', options: ['Control Normal', 'Hipertension'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-heartbeat' },
        { name: 'Observaciones - Presión Arterial', label: 'Obs. Presión Arterial', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'IMC', label: 'IMC', type: 'select', options: ['Bajo Peso', 'Control Normal', 'Sobrepeso', 'Obesidad', 'Obesidad Morbida'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-weight' },
        { name: 'Observaciones - IMC', label: 'Obs. IMC', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Alimentación saludable', label: 'Alimentación saludable', type: 'select', options: ['No', 'Si'], required: true, icon: 'fas fa-apple-alt' },
        { name: 'Observaciones - Alimentación saludable', label: 'Obs. Alimentación saludable', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 2
        { name: 'Actividad física', label: 'Actividad física', type: 'select', options: ['No realiza', 'Si realiza'], required: true, icon: 'fas fa-running' },
        { name: 'Observaciones - Actividad física', label: 'Obs. Actividad física', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Seguridad vial', label: 'Seguridad vial', type: 'select', options: ['Cumple', 'No cumple'], required: true, icon: 'fas fa-car' },
        { name: 'Observaciones - Seguridad vial', label: 'Obs. Seguridad vial', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Tabaco', label: 'Tabaco', type: 'select', options: ['Fuma', 'No fuma'], required: true, icon: 'fas fa-smoking' },
        { name: 'Observaciones - Tabaco', label: 'Obs. Tabaco', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 3
        { name: 'Violencia', label: 'Violencia', type: 'select', options: ['No se verifica', 'Se verifica'], required: true, icon: 'fas fa-hand-rock' },
        { name: 'Observaciones - Violencia', label: 'Obs. Violencia', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Examen Fisico', label: 'Examen Fisico', type: 'select', options: ['Control Normal', 'Con Observaciones'], required: true, icon: 'fas fa-user-md' },
        { name: 'Observaciones - Examen Fisico', label: 'Obs. Examen Fisico', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Talla', label: 'Talla', type: 'select', options: ['Alta', 'Baja', 'Control Normal'], required: true, icon: 'fas fa-ruler-vertical' },
        { name: 'Observaciones - Talla', label: 'Obs. Talla', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 4
        { name: 'Salud Ocular', label: 'Salud Ocular', type: 'select', options: ['Alterada', 'Control Normal'], required: true, icon: 'fas fa-eye' },
        { name: 'Observaciones - Salud Ocular', label: 'Obs. Salud Ocular', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Audición', label: 'Audición', type: 'select', options: ['Alterada', 'Control Normal'], required: true, icon: 'fas fa-ear-listen' },
        { name: 'Observaciones - Audición', label: 'Obs. Audición', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Salud Cardiovascular', label: 'Salud Cardiovascular', type: 'select', options: ['Control Normal', 'Con Observaciones'], required: true, icon: 'fas fa-heart' },
        { name: 'Observaciones - Salud Cardiovascular', label: 'Obs. Salud Cardiovascular', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 5
        { name: 'Educación sexual', label: 'Educación sexual', type: 'select', options: ['Consejeria', 'Con Observaciones'], required: true, icon: 'fas fa-venus-mars' },
        { name: 'Observaciones - Educación sexual', label: 'Obs. Educación sexual', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Salud Mental Integral', label: 'Salud Mental Integral', type: 'select', options: ['Consejeria', 'Con Observaciones'], required: true, icon: 'fas fa-brain' },
        { name: 'Observaciones - Salud Mental', label: 'Obs. Salud Mental', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Consumo de sustancias problemáticas', label: 'Consumo de sustancias problemáticas', type: 'select', options: ['No aplica', 'Presenta', 'No presenta'], required: true, icon: 'fas fa-syringe' },
        { name: 'Observaciones - Consumo de sustancias', label: 'Obs. Consumo de sustancias', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 6
        { name: 'Pesquisa de Dislipemia', label: 'Pesquisa de Dislipemia', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-blood-drop' },
        { name: 'Observaciones - Dislipemia', label: 'Obs. Dislipemia', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Síndrome Metabólico', label: 'Síndrome Metabólico', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], required: true, icon: 'fas fa-thermometer-half' },
        { name: 'Observaciones - Síndrome Metabólico', label: 'Obs. Síndrome Metabólico', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Escoliosis', label: 'Escoliosis', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], required: true, icon: 'fas fa-shoe-prints' },
        { name: 'Observaciones - Escoliosis', label: 'Obs. Escoliosis', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 7
        { name: 'Cáncer cérvico uterino', label: 'Cáncer cérvico uterino', type: 'select', options: ['No aplica', 'No tiene vacuna VPH', 'Tiene vacuna VPH'], required: true, icon: 'fas fa-dna' },
        { name: 'Observaciones - Cáncer cérvico uterino', label: 'Obs. Cáncer cérvico uterino', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Cáncer de piel', label: 'Cáncer de piel', type: 'select', options: ['Consejeria', 'Derivacion a especialista'], required: true, icon: 'fas fa-sun' },
        { name: 'Observaciones - Cáncer de piel', label: 'Obs. Cáncer de piel', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Desarrollo escolar y aprendizaje', label: 'Desarrollo escolar y aprendizaje', type: 'select', options: ['Acorde a edad', 'No acorde a edad', 'No aplica'], required: true, icon: 'fas fa-school' },
        { name: 'Observaciones - Desarrollo escolar', label: 'Obs. Desarrollo escolar', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 8 (Pantallas y Vacunas)
        { name: 'Uso de pantallas', label: 'Uso de pantallas', type: 'select', options: ['Si', 'No'], required: true, icon: 'fas fa-mobile-alt' },
        { name: 'Cantidad de horas diarias', label: 'Cantidad de horas diarias', type: 'text', required: false, icon: 'fas fa-clock', placeholder: 'Ej: 2 horas' }, 
        { name: 'Observaciones - Uso de pantallas', label: 'Obs. Uso de pantallas', type: 'textarea', required: false, icon: 'fas fa-comment' },
        
        { name: 'Control de vacunas de calendario', label: 'Control de vacunas de calendario', type: 'select', options: ['Completo', 'Incompleto'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-syringe' },
        { name: 'Observaciones - Vacunas', label: 'Obs. Vacunas', type: 'textarea', required: false, icon: 'fas fa-comment' },

        // Paso 9
        { name: 'Control Odontológico - Niños', label: 'Control Odontológico - Niños', type: 'select', options: ['Control Normal', 'Riesgo Alto', 'Riesgo Bajo', 'Riesgo Moderado', 'No aplica'], hasStudyButton: true, studyType: 'Odontologia', required: true, icon: 'fas fa-tooth' },
        { name: 'Observaciones - Control Odontológico', label: 'Obs. Control Odontológico', type: 'textarea', required: false, icon: 'fas fa-comment' },
    ];

    // --- FUNCIONES ---

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            if (data.isLoggedIn) {
                mainContent.classList.remove('hidden');
                unauthorizedMessage.classList.add('hidden');
                profesionalInput.value = data.user.name;
            } else {
                mainContent.classList.add('hidden');
                unauthorizedMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error Auth:', error);
            mainContent.classList.add('hidden');
        }
    }
    
    // --- LÓGICA DE VALIDACIÓN MEJORADA ---
    function setupConditionalValidation() {
        const selects = document.querySelectorAll('select');
        
        selects.forEach(select => {
            select.addEventListener('change', function() {
                const value = this.value;
                const fieldName = this.name; // Nombre original "Salud Mental Integral"
                
                // Encontrar el textarea correspondiente (asumiendo que está en el mismo paso)
                // Buscamos el input que tenga name="Observaciones - [Nombre del select]"
                // O casos especiales como "Observaciones - Salud Mental"
                
                let obsFieldName = `Observaciones - ${fieldName}`;
                
                // Correcciones manuales para nombres que no siguen el patrón exacto "Observaciones - Nombre Exacto"
                if (fieldName === 'Salud Mental Integral') obsFieldName = 'Observaciones - Salud Mental';
                if (fieldName === 'Consumo de sustancias problemáticas') obsFieldName = 'Observaciones - Consumo de sustancias';
                if (fieldName === 'Pesquisa de Dislipemia') obsFieldName = 'Observaciones - Dislipemia';
                if (fieldName === 'Control de vacunas de calendario') obsFieldName = 'Observaciones - Vacunas';
                if (fieldName === 'Control Odontológico - Niños') obsFieldName = 'Observaciones - Control Odontológico';

                // Normalizamos para encontrar el ID
                const obsId = obsFieldName.replace(/\s/g, '_').replace(/-/g, '_').replace(/[\(\)]/g, '');
                const textarea = document.getElementById(obsId);

                if (textarea) {
                    let esObligatorio = false;

                    // Reglas Generales
                    const triggers = ['con observaciones', 'alterada', 'hipertension', 'obesidad', 'bajo peso', 'sobrepeso', 'se verifica', 'incompleto', 'no acorde', 'no cumple', 'riesgo', 'patologico', 'fuma'];
                    if (triggers.some(t => value.toLowerCase().includes(t))) esObligatorio = true;

                    // Reglas Específicas
                    if (fieldName === 'Alimentación saludable' && value === 'No') esObligatorio = true;
                    if (fieldName === 'Actividad física' && value === 'No realiza') esObligatorio = true;
                    if (fieldName === 'Consumo de sustancias problemáticas' && value === 'Presenta') esObligatorio = true;
                    if (fieldName === 'Síndrome Metabólico' && value === 'Presenta') esObligatorio = true;
                    if (fieldName === 'Escoliosis' && value === 'Presenta') esObligatorio = true;
                    if (fieldName === 'Pesquisa de Dislipemia' && value === 'Presenta') esObligatorio = true;
                    
                    // Aplicar validación
                    if (esObligatorio) {
                        textarea.required = true;
                        textarea.classList.add('ring-2', 'ring-yellow-400', 'bg-yellow-50');
                        textarea.placeholder = "⚠️ Detalle obligatorio por la opción seleccionada...";
                    } else {
                        textarea.required = false;
                        textarea.classList.remove('ring-2', 'ring-yellow-400', 'bg-yellow-50');
                        textarea.placeholder = "Ingrese observaciones si corresponde...";
                    }
                }
            });
        });
    }

    function generateFormSteps() {
        formStepsContainer.innerHTML = ''; 
        formSteps = []; 
        let stepDiv;
        let fieldCounter = 0;
        const fieldsPerStep = 6; 

        fieldsConfig.forEach((field) => {
            if (fieldCounter % fieldsPerStep === 0) { 
                stepDiv = document.createElement('div');
                stepDiv.className = 'form-step grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-lg shadow-inner border border-blue-100 hidden'; 
                formStepsContainer.appendChild(stepDiv);
                formSteps.push(stepDiv);
            }

            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'mb-4';
            
            const label = document.createElement('label');
            // Usamos field.name tal cual para el display, normalizamos para el ID
            const fieldId = field.name.replace(/\s/g, '_').replace(/-/g, '_').replace(/[\(\)]/g, '');
            label.htmlFor = fieldId;
            label.className = 'block text-gray-700 text-sm font-bold mb-2 flex items-center';
            if (field.icon) {
                const icon = document.createElement('i');
                icon.className = `${field.icon} mr-2 text-blue-600`;
                label.appendChild(icon);
            }
            label.appendChild(document.createTextNode(field.label + ':'));

            let inputElement;
            const inputClasses = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';

            if (field.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.className = inputClasses + ' bg-white';
                inputElement.id = fieldId;
                inputElement.name = field.name; // IMPORTANTE: Nombre con espacios para el servidor
                inputElement.required = field.required !== false;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione...';
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
                inputElement.id = fieldId;
                inputElement.name = field.name;
                inputElement.required = field.required !== false;
            } else { 
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.className = inputClasses;
                inputElement.id = fieldId;
                inputElement.name = field.name;
                inputElement.required = field.required !== false;
                if(field.placeholder) inputElement.placeholder = field.placeholder;
            }

            fieldContainer.appendChild(label);

            if (field.hasStudyButton) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'flex items-center';
                inputGroup.appendChild(inputElement);

                const studyButton = document.createElement('button');
                studyButton.className = 'bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-3 rounded-r ml-1 border border-blue-200 focus:outline-none transition flex-shrink-0 text-xs';
                studyButton.innerHTML = `<i class="fas fa-search"></i> Ver`;
                studyButton.dataset.studyType = field.studyType;
                studyButton.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    if (currentPatientDNI) {
                        mostrarEstudiosModal(currentPatientDNI, studyButton.dataset.studyType);
                    } else {
                        alert('DNI del paciente no disponible.');
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

        setupConditionalValidation();
        showStep(0); 
    }

    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.add('hidden');
            if (index === stepIndex) {
                step.classList.remove('hidden');
                formStepsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        currentStep = stepIndex;
        updateProgressBar();
        updateNavigationButtons();
    }

    function updateProgressBar() {
        const progress = formSteps.length === 0 ? 0 : ((currentStep + 1) / formSteps.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function updateNavigationButtons() {
        if (currentStep === 0) prevStepBtn.classList.add('hidden');
        else prevStepBtn.classList.remove('hidden');

        if (currentStep === formSteps.length - 1) {
            nextStepBtn.classList.add('hidden');
            guardarCierreBtn.classList.remove('hidden'); 
        } else {
            nextStepBtn.classList.remove('hidden');
            guardarCierreBtn.classList.add('hidden'); 
        }
    }

    function resetForm() {
        dniInput.value = '';
        dniDisplayInput.value = '';
        efectorInput.value = '';
        pacienteApellidoInput.value = '';
        pacienteNombreInput.value = '';
        pacienteEdadInput.value = '';
        pacienteSexoSelect.value = '';
        
        const today = new Date().toISOString().split('T')[0];
        fechaCierreInput.value = today;
        
        profesionalInput.value = ''; 
        checkAuthStatus(); 

        patientInfoDisplay.classList.add('hidden');
        cierreForm.classList.add('hidden');
        formStepsContainer.innerHTML = ''; 
        currentStep = 0;
        formSteps = [];
        updateProgressBar();
        currentPatientDNI = null;
        cargarDatosBtn.disabled = true; 
    }

    async function mostrarEstudiosModal(dni, studyType) {
        estudiosModalContent.innerHTML = '<div class="flex justify-center p-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';
        modalDNI.textContent = dni;
        estudiosModal.classList.remove('hidden');

        try {
            const response = await fetch(`/api/estudios/${dni}/${studyType}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                let html = `<p class="text-green-600 font-semibold mb-3 bg-green-50 p-2 rounded"><i class="fas fa-check-circle mr-2"></i>${result.data.length} estudio(s) encontrado(s).</p>`;
                
                result.data.forEach((study, index) => {
                    html += `<div class="p-4 mb-4 border border-blue-100 rounded-lg bg-white shadow-sm hover:shadow-md transition">`;
                    html += `<div class="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">`;
                    html += `<h4 class="font-bold text-blue-800">Resultado #${index + 1}</h4>`;
                    html += `<span class="text-xs text-gray-500">${study['Fecha'] || ''}</span>`;
                    html += `</div>`;
                    
                    html += `<div class="grid grid-cols-1 gap-1 text-sm">`;
                    Object.entries(study).forEach(([key, value]) => {
                        if (!value || key === 'LinkPDF' || key === 'Link a PDF' || key === 'URL PDF' || key === 'Archivo' || key === 'DNI') return;
                        html += `<div class="flex"><span class="font-semibold text-gray-700 w-1/3">${key}:</span> <span class="text-gray-600 w-2/3">${value}</span></div>`;
                    });
                    html += `</div>`;

                    const pdfLink = study['Link a PDF'] || study['LinkPDF'] || study['URL PDF'] || study['Archivo'];
                    
                    if (pdfLink && pdfLink.length > 5) {
                        html += `<div class="mt-3 pt-2 border-t border-gray-100 flex justify-end">`;
                        html += `<a href="${pdfLink}" target="_blank" class="inline-flex items-center px-2 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded hover:bg-red-100 transition shadow-sm">`;
                        html += `<i class="fas fa-file-pdf mr-1"></i> Ver Informe PDF`;
                        html += `</a>`;
                        html += `</div>`;
                    }
                    html += `</div>`;
                });
                estudiosModalContent.innerHTML = html;
            } else {
                estudiosModalContent.innerHTML = `<div class="text-center p-6 bg-gray-50 rounded-lg border border-gray-200"><i class="fas fa-search text-gray-400 text-3xl mb-2"></i><p class="text-gray-600">No hay registros de ${studyType}.</p></div>`;
            }

        } catch (error) {
            console.error('Error:', error);
            estudiosModalContent.innerHTML = `<p class="text-center text-red-600 p-4 bg-red-50 rounded-md border border-red-200">Error de conexión al buscar estudios.</p>`;
        }
    }

    // --- EVENTOS ---
    
    checkAuthStatus();
    const today = new Date().toISOString().split('T')[0];
    fechaCierreInput.value = today;

    dniInput.addEventListener('input', () => {
        cargarDatosBtn.disabled = !(dniInput.value.trim().length > 0);
        if (!dniInput.value.trim()) resetForm();
    });

    cargarDatosBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dni = dniInput.value.trim();
        if (!dni) return;
        dniDisplayInput.value = dni;
        currentPatientDNI = dni;
        patientInfoDisplay.classList.remove('hidden');
        cierreForm.classList.remove('hidden');
        generateFormSteps();
    });

    nextStepBtn.addEventListener('click', () => {
        const currentStepFields = formSteps[currentStep].querySelectorAll('input, select, textarea');
        let stepIsValid = true;
        currentStepFields.forEach(field => {
            if (field.required && !field.value.trim()) {
                field.classList.add('border-red-500', 'ring-red-500');
                stepIsValid = false;
            } else {
                field.classList.remove('border-red-500', 'ring-red-500');
            }
        });
        if (!stepIsValid) {
            alert('Complete los campos obligatorios para continuar.');
            return;
        }
        if (currentStep < formSteps.length - 1) showStep(currentStep + 1);
    });

    prevStepBtn.addEventListener('click', () => {
        if (currentStep > 0) showStep(currentStep - 1);
    });

    guardarCierreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const fixedFields = [dniDisplayInput, efectorInput, pacienteApellidoInput, pacienteNombreInput, pacienteEdadInput, pacienteSexoSelect];
        let allFieldsValid = true;
        const formData = {};

        fixedFields.forEach(input => {
            if (input.required && !input.value.trim()) {
                allFieldsValid = false;
                input.classList.add('border-red-500', 'ring-red-500');
            } else {
                input.classList.remove('border-red-500', 'ring-red-500');
            }
            formData[input.name] = input.value.trim();
        });

        formData['FECHA'] = fechaCierreInput.value;

        const allDynamicInputs = cierreForm.querySelectorAll('.form-step input, .form-step select, .form-step textarea');
        allDynamicInputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                allFieldsValid = false;
                input.classList.add('border-red-500', 'ring-red-500'); 
            } else {
                input.classList.remove('border-red-500', 'ring-red-500');
            }
            // Aquí usamos input.name que AHORA SÍ tiene los espacios correctos del Config
            formData[input.name] = input.value.trim();
        });
        
        formData['Profesional'] = profesionalInput.value;
        formData['Apellido_Nombre'] = `${formData['Apellido']} ${formData['Nombre']}`;

        if (!allFieldsValid) {
            alert('Por favor, complete todos los campos obligatorios (marcados en rojo o amarillo).');
            return;
        }

        guardarCierreBtn.disabled = true;
        guardarCierreBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';

        try {
            const response = await fetch('/api/cierre-pediatria/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                resetForm(); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert(`Error al guardar: ${result.error || result.details}`);
            }
        } catch (error) {
            console.error('Error save:', error);
            alert('Error de conexión al guardar.');
        } finally {
            guardarCierreBtn.disabled = false;
            guardarCierreBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Guardar Cierre Pediatría';
        }
    });

    cancelarCierreBtn.addEventListener('click', () => {
        if (confirm('¿Cancelar carga actual?')) resetForm();
    });

    closeModalBtn.addEventListener('click', () => estudiosModal.classList.add('hidden'));
    modalCloseButtonBottom.addEventListener('click', () => estudiosModal.classList.add('hidden'));
    window.addEventListener('click', (event) => {
        if (event.target === estudiosModal) estudiosModal.classList.add('hidden');
    });
});