document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES ---
    let currentPatientDNI = null; // Variable crítica para los estudios
    let currentStep = 0; 
    let formSteps = []; 

    // --- ELEMENTOS DOM ---
    const unauthorizedMessage = document.getElementById('unauthorized-message');
    const mainContent = document.getElementById('main-content');
    
    // Paneles
    const searchSection = document.getElementById('search-section');
    const patientDataSection = document.getElementById('patient-data-section');
    const cierreForm = document.getElementById('cierre-pediatria-form');
    const btnCancelarContainer = document.getElementById('btn-cancelar-container');
    
    // Inputs Datos Fijos
    const dniInput = document.getElementById('paciente-dni');
    const cargarDatosBtn = document.getElementById('cargar-datos-btn');
    const dniDisplayInput = document.getElementById('dni-input'); // El que se guarda
    const efectorInput = document.getElementById('efector-input');
    const pacienteApellidoInput = document.getElementById('paciente-apellido');
    const pacienteNombreInput = document.getElementById('paciente-nombre');
    const pacienteEdadInput = document.getElementById('paciente-edad');
    const pacienteSexoSelect = document.getElementById('paciente-sexo');
    const fechaCierreInput = document.getElementById('fecha-cierre-input');
    const profesionalInput = document.getElementById('profesional-input');
    
    // Botones Flujo
    const btnConfirmarDatos = document.getElementById('btn-confirmar-datos');
    const btnEditarDatos = document.getElementById('btn-editar-datos');
    const resumenNombre = document.getElementById('resumen-nombre');
    const resumenDni = document.getElementById('resumen-dni');

    // Navegación Formulario
    const formStepsContainer = document.getElementById('form-steps-container');
    const progressBar = document.getElementById('progress-bar');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const guardarCierreBtn = document.getElementById('guardar-cierre-btn');
    const cancelarCierreBtn = document.getElementById('cancelar-cierre-btn');

    // Modal Estudios
    const estudiosModal = document.getElementById('estudiosModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCloseButtonBottom = document.getElementById('modalCloseButtonBottom');
    const modalDNI = document.getElementById('modalDNI');
    const estudiosModalContent = document.getElementById('estudiosModalContent');

    // --- CONFIGURACIÓN DE CAMPOS ---
    const stepsConfig = [
        [{ name: 'Presión Arterial', label: 'Presión Arterial', type: 'select', options: ['Control Normal', 'Hipertension'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-heartbeat' }, { name: 'Observaciones - Presión Arterial', label: 'Obs. Presión Arterial', type: 'textarea', required: false }],
        [{ name: 'IMC', label: 'IMC', type: 'select', options: ['Bajo Peso', 'Control Normal', 'Sobrepeso', 'Obesidad', 'Obesidad Morbida'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-weight' }, { name: 'Observaciones - IMC', label: 'Obs. IMC', type: 'textarea', required: false }],
        [{ name: 'Alimentación saludable', label: 'Alimentación saludable', type: 'select', options: ['No', 'Si'], required: true, icon: 'fas fa-apple-alt' }, { name: 'Observaciones - Alimentación saludable', label: 'Obs. Alimentación saludable', type: 'textarea', required: false }],
        [{ name: 'Actividad física', label: 'Actividad física', type: 'select', options: ['No realiza', 'Si realiza'], required: true, icon: 'fas fa-running' }, { name: 'Observaciones - Actividad física', label: 'Obs. Actividad física', type: 'textarea', required: false }],
        [{ name: 'Seguridad vial', label: 'Seguridad vial', type: 'select', options: ['Cumple', 'No cumple'], required: true, icon: 'fas fa-car' }, { name: 'Observaciones - Seguridad vial', label: 'Obs. Seguridad vial', type: 'textarea', required: false }],
        [{ name: 'Tabaco', label: 'Tabaco', type: 'select', options: ['Fuma', 'No fuma'], required: true, icon: 'fas fa-smoking' }, { name: 'Observaciones - Tabaco', label: 'Obs. Tabaco', type: 'textarea', required: false }],
        [{ name: 'Violencia', label: 'Violencia', type: 'select', options: ['No se verifica', 'Se verifica'], required: true, icon: 'fas fa-hand-rock' }, { name: 'Observaciones - Violencia', label: 'Obs. Violencia', type: 'textarea', required: false }],
        [{ name: 'Examen Fisico', label: 'Examen Fisico', type: 'select', options: ['Control Normal', 'Con Observaciones'], required: true, icon: 'fas fa-user-md' }, { name: 'Observaciones - Examen Fisico', label: 'Obs. Examen Fisico', type: 'textarea', required: false }],
        [{ name: 'Talla', label: 'Talla', type: 'select', options: ['Alta', 'Baja', 'Control Normal'], required: true, icon: 'fas fa-ruler-vertical' }, { name: 'Observaciones - Talla', label: 'Obs. Talla', type: 'textarea', required: false }],
        [{ name: 'Salud Ocular', label: 'Salud Ocular', type: 'select', options: ['Alterada', 'Control Normal'], required: true, icon: 'fas fa-eye' }, { name: 'Observaciones - Salud Ocular', label: 'Obs. Salud Ocular', type: 'textarea', required: false }],
        [{ name: 'Audición', label: 'Audición', type: 'select', options: ['Alterada', 'Control Normal'], required: true, icon: 'fas fa-ear-listen' }, { name: 'Observaciones - Audición', label: 'Obs. Audición', type: 'textarea', required: false }],
        [{ name: 'Salud Cardiovascular', label: 'Salud Cardiovascular', type: 'select', options: ['Control Normal', 'Con Observaciones'], required: true, icon: 'fas fa-heart' }, { name: 'Observaciones - Salud Cardiovascular', label: 'Obs. Salud Cardiovascular', type: 'textarea', required: false }],
        [{ name: 'Educación sexual', label: 'Educación Sexual', type: 'select', options: ['Consejeria', 'Con Observaciones'], required: true, icon: 'fas fa-venus-mars' }, { name: 'Observaciones - Educación sexual', label: 'Obs. Educación sexual', type: 'textarea', required: false }],
        [{ name: 'Salud Mental Integral', label: 'Salud Mental Integral', type: 'select', options: ['Consejeria', 'Con Observaciones'], required: true, icon: 'fas fa-brain' }, { name: 'Observaciones - Salud Mental', label: 'Obs. Salud Mental', type: 'textarea', required: false }],
        [{ name: 'Consumo de sustancias problemáticas', label: 'Consumo de sustancias problemáticas', type: 'select', options: ['No aplica', 'Presenta', 'No presenta'], required: true, icon: 'fas fa-syringe' }, { name: 'Observaciones - Consumo de sustancias', label: 'Obs. Consumo de sustancias', type: 'textarea', required: false }],
        [{ name: 'Pesquisa de Dislipemia', label: 'Pesquisa de Dislipemia', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-blood-drop' }, { name: 'Observaciones - Dislipemia', label: 'Obs. Dislipemia', type: 'textarea', required: false }],
        [{ name: 'Síndrome Metabólico', label: 'Síndrome Metabólico', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], required: true, icon: 'fas fa-thermometer-half' }, { name: 'Observaciones - Síndrome Metabólico', label: 'Obs. Síndrome Metabólico', type: 'textarea', required: false }],
        [{ name: 'Escoliosis', label: 'Escoliosis', type: 'select', options: ['No aplica', 'No presenta', 'Presenta'], required: true, icon: 'fas fa-shoe-prints' }, { name: 'Observaciones - Escoliosis', label: 'Obs. Escoliosis', type: 'textarea', required: false }],
        [{ name: 'Cáncer cérvico uterino', label: 'Cáncer cérvico uterino', type: 'select', options: ['No aplica', 'No tiene vacuna VPH', 'Tiene vacuna VPH'], required: true, icon: 'fas fa-dna' }, { name: 'Observaciones - Cáncer cérvico uterino', label: 'Obs. Cáncer cérvico uterino', type: 'textarea', required: false }],
        [{ name: 'Cáncer de piel', label: 'Cáncer de piel', type: 'select', options: ['Consejeria', 'Derivacion a especialista'], required: true, icon: 'fas fa-sun' }, { name: 'Observaciones - Cáncer de piel', label: 'Obs. Cáncer de piel', type: 'textarea', required: false }],
        [{ name: 'Desarrollo escolar y aprendizaje', label: 'Desarrollo escolar y aprendizaje', type: 'select', options: ['Acorde a edad', 'No acorde a edad', 'No aplica'], required: true, icon: 'fas fa-school' }, { name: 'Observaciones - Desarrollo escolar', label: 'Obs. Desarrollo escolar', type: 'textarea', required: false }],
        
        [{ name: 'Uso de pantallas', label: 'Uso de pantallas', type: 'select', options: ['Si', 'No'], required: true, icon: 'fas fa-mobile-alt' }, { name: 'Cantidad de horas diarias', label: 'Cantidad de horas diarias', type: 'text', required: false, icon: 'fas fa-clock', placeholder: 'Ej: 2 horas' }, { name: 'Observaciones - Uso de pantallas', label: 'Obs. Uso de pantallas', type: 'textarea', required: false }],

        [{ name: 'Control de vacunas de calendario', label: 'Control de vacunas de calendario', type: 'select', options: ['Completo', 'Incompleto'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-syringe' }, { name: 'Observaciones - Vacunas', label: 'Obs. Vacunas', type: 'textarea', required: false }],
        [{ name: 'Control Odontológico - Niños', label: 'Control Odontológico - Niños', type: 'select', options: ['Control Normal', 'Riesgo Alto', 'Riesgo Bajo', 'Riesgo Moderado', 'No aplica'], hasStudyButton: true, studyType: 'Odontologia', required: true, icon: 'fas fa-tooth' }, { name: 'Observaciones - Control Odontológico', label: 'Obs. Control Odontológico', type: 'textarea', required: false }]
    ];

    const strictValidationRules = {
        'Presión Arterial': ['Hipertension'],
        'IMC': ['Bajo Peso', 'Sobrepeso', 'Obesidad', 'Obesidad Morbida'],
        'Alimentación saludable': ['No'],
        'Actividad física': ['No realiza'],
        'Seguridad vial': ['No cumple'],
        'Tabaco': ['Fuma'],
        'Violencia': ['Se verifica'],
        'Examen Fisico': ['Con Observaciones'],
        'Talla': ['Alta', 'Baja'],
        'Salud Ocular': ['Alterada'],
        'Audición': ['Alterada'],
        'Salud Cardiovascular': ['Con Observaciones'],
        'Educación sexual': ['Con Observaciones'],
        'Salud Mental Integral': ['Con Observaciones'],
        'Consumo de sustancias problemáticas': ['Presenta'],
        'Pesquisa de Dislipemia': ['Presenta'],
        'Síndrome Metabólico': ['Presenta'],
        'Escoliosis': ['Presenta'],
        'Cáncer cérvico uterino': ['No tiene vacuna VPH'],
        'Cáncer de piel': ['Derivacion a especialista'],
        'Desarrollo escolar y aprendizaje': ['No acorde a edad'],
        'Control de vacunas de calendario': ['Incompleto'],
        'Control Odontológico - Niños': ['Riesgo Alto', 'Riesgo Moderado', 'Riesgo Bajo']
    };

    // --- INIT ---
    checkAuthStatus();
    const today = new Date().toISOString().split('T')[0];
    if(fechaCierreInput) fechaCierreInput.value = today;

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

    // --- GENERADOR DE PREGUNTAS ---
    function generateFormSteps() {
        formStepsContainer.innerHTML = ''; 
        formSteps = []; 
        let stepDiv;

        stepsConfig.forEach((pageFields) => {
            stepDiv = document.createElement('div');
            stepDiv.className = 'form-step hidden'; 
            
            pageFields.forEach(field => {
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'mb-6';
                const fieldId = field.name.replace(/\s/g, '_').replace(/-/g, '_').replace(/[\(\)]/g, '');
                
                const label = document.createElement('label');
                label.htmlFor = fieldId;
                label.className = 'block text-gray-700 text-sm font-bold mb-2 flex items-center';
                if (field.icon) {
                    const icon = document.createElement('i');
                    icon.className = `${field.icon} mr-2 text-blue-600`;
                    label.appendChild(icon);
                }
                label.appendChild(document.createTextNode(field.label + ':'));
                fieldContainer.appendChild(label);

                let inputElement;
                const inputClasses = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';

                if (field.type === 'select') {
                    inputElement = document.createElement('select');
                    inputElement.className = inputClasses + ' bg-white';
                    inputElement.id = fieldId;
                    inputElement.name = field.name; 
                    inputElement.required = field.required !== false;
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seleccione...';
                    defaultOption.disabled = true;
                    defaultOption.selected = true;
                    inputElement.appendChild(defaultOption);
                    field.options.forEach(opt => {
                        const o = document.createElement('option');
                        o.value = opt; o.textContent = opt;
                        inputElement.appendChild(o);
                    });
                } else if (field.type === 'textarea') {
                    inputElement = document.createElement('textarea');
                    inputElement.className = `${inputClasses} h-24 resize-y`;
                    inputElement.id = fieldId;
                    inputElement.name = field.name;
                    inputElement.required = field.required !== false;
                    inputElement.placeholder = "Ingrese observaciones si corresponde...";
                } else { 
                    inputElement = document.createElement('input');
                    inputElement.type = field.type;
                    inputElement.className = inputClasses;
                    inputElement.id = fieldId;
                    inputElement.name = field.name;
                    inputElement.required = field.required !== false;
                    if(field.placeholder) inputElement.placeholder = field.placeholder;
                }

                if (field.hasStudyButton) {
                    const inputGroup = document.createElement('div');
                    inputGroup.className = 'flex items-center';
                    inputGroup.appendChild(inputElement);
                    const studyButton = document.createElement('button');
                    studyButton.className = 'bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-3 rounded-r ml-1 border border-blue-200 focus:outline-none transition flex-shrink-0 text-xs';
                    studyButton.innerHTML = `<i class="fas fa-search"></i> Ver`;
                    studyButton.dataset.studyType = field.studyType;
                    
                    // CORRECCIÓN ESTUDIOS: Usamos currentPatientDNI global
                    studyButton.addEventListener('click', (e) => {
                        e.preventDefault(); 
                        if (currentPatientDNI) {
                            mostrarEstudiosModal(currentPatientDNI, field.studyType);
                        } else {
                            alert('No hay un DNI seleccionado. Por favor reinicie la búsqueda.');
                        }
                    });  
                    inputGroup.appendChild(studyButton);
                    fieldContainer.appendChild(inputGroup);
                } else {
                    fieldContainer.appendChild(inputElement);
                }
                stepDiv.appendChild(fieldContainer);
            });
            formStepsContainer.appendChild(stepDiv);
            formSteps.push(stepDiv);
        });
        setupConditionalValidation();
        showStep(0); 
    }

    // --- NAVEGACIÓN Y VALIDACIÓN ---
    function setupConditionalValidation() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', function() {
                const value = this.value;
                const fieldName = this.name;
                
                let obsFieldName = `Observaciones - ${fieldName}`;
                if (fieldName === 'Salud Mental Integral') obsFieldName = 'Observaciones - Salud Mental';
                if (fieldName === 'Consumo de sustancias problemáticas') obsFieldName = 'Observaciones - Consumo de sustancias';
                if (fieldName === 'Pesquisa de Dislipemia') obsFieldName = 'Observaciones - Dislipemia';
                if (fieldName === 'Control de vacunas de calendario') obsFieldName = 'Observaciones - Vacunas';
                if (fieldName === 'Control Odontológico - Niños') obsFieldName = 'Observaciones - Control Odontológico';

                const obsId = obsFieldName.replace(/\s/g, '_').replace(/-/g, '_').replace(/[\(\)]/g, '');
                const textarea = document.getElementById(obsId);

                if (fieldName === 'Uso de pantallas') {
                    const horasInput = document.getElementById('Cantidad_de_horas_diarias');
                    if (horasInput) {
                        if (value === 'Si') {
                            horasInput.required = true;
                            horasInput.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
                        } else {
                            horasInput.required = false;
                            horasInput.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
                            horasInput.value = '';
                        }
                    }
                    return; 
                }

                if (textarea) {
                    const triggers = strictValidationRules[fieldName] || [];
                    const isRequired = triggers.includes(value);
                    if (isRequired) {
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

    function showStep(index) {
        formSteps.forEach((step, i) => {
            if (i === index) {
                step.classList.remove('hidden');
                // Scroll suave al top del FORMULARIO (no de la página, para no tapar el resumen si hubiera)
                cierreForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                step.classList.add('hidden');
            }
        });
        currentStep = index;
        if(progressBar && formSteps.length > 0) {
            const progress = ((currentStep + 1) / formSteps.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        updateNavigationButtons();
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

    // --- EVENTOS FLUJO ---
    
    // 1. Buscar DNI
    dniInput.addEventListener('input', () => {
        cargarDatosBtn.disabled = !dniInput.value.trim();
        if(!dniInput.value.trim()) resetForm();
    });

    cargarDatosBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dni = dniInput.value.trim();
        if(!dni) return;
        
        currentPatientDNI = dni; // GUARDAMOS EL DNI GLOBALMENTE
        dniDisplayInput.value = dni; // Llenamos el input oculto/visible de la fase 2
        
        // Cambio de pantalla: Buscador -> Datos
        searchSection.classList.add('hidden');
        patientDataSection.classList.remove('hidden');
    });

    // 2. Confirmar Datos y pasar a Preguntas
    btnConfirmarDatos.addEventListener('click', () => {
        // Validar que se hayan llenado los datos fijos
        if(!pacienteApellidoInput.value || !pacienteNombreInput.value || !efectorInput.value || !pacienteEdadInput.value || !pacienteSexoSelect.value) {
            alert("Por favor complete todos los datos del paciente (Apellido, Nombre, Edad, Sexo, Efector).");
            return;
        }

        // Mostrar resumen (opcional) o simplemente cambiar vista
        if(resumenNombre) resumenNombre.textContent = `${pacienteApellidoInput.value} ${pacienteNombreInput.value}`;
        if(resumenDni) resumenDni.textContent = dniDisplayInput.value;

        // Cambio de pantalla: Datos -> Preguntas
        patientDataSection.classList.add('hidden');
        cierreForm.classList.remove('hidden');
        btnCancelarContainer.classList.remove('hidden'); // Botón cancelar abajo
        if(document.getElementById('mini-patient-header')) document.getElementById('mini-patient-header').classList.remove('hidden'); // Si usas el mini header

        generateFormSteps();
    });

    // 3. Editar Datos (Volver atrás)
    if(btnEditarDatos) {
        btnEditarDatos.addEventListener('click', () => {
            cierreForm.classList.add('hidden');
            btnCancelarContainer.classList.add('hidden');
            patientDataSection.classList.remove('hidden');
        });
    }

    // 4. Navegación Preguntas
    nextStepBtn.addEventListener('click', () => {
        const currentInputs = formSteps[currentStep].querySelectorAll('input, select, textarea');
        let valid = true;
        currentInputs.forEach(i => {
            if(i.required && !i.value.trim()) {
                valid = false;
                i.classList.add('border-red-500', 'ring-2', 'ring-red-500');
            } else {
                i.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
            }
        });
        if(valid) showStep(currentStep + 1);
        else alert('Complete los campos obligatorios.');
    });

    prevStepBtn.addEventListener('click', () => {
        if(currentStep > 0) showStep(currentStep - 1);
    });

    // 5. GUARDAR (CORREGIDO PARA RECOLECTAR TODO)
    guardarCierreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Recolectar Datos Fijos (aunque estén ocultos en la pantalla anterior, existen en el DOM)
        const formData = {
            'DNI': dniDisplayInput.value,
            'Efector': efectorInput.value,
            'Apellido': pacienteApellidoInput.value,
            'Nombre': pacienteNombreInput.value,
            'Edad': pacienteEdadInput.value,
            'Sexo': pacienteSexoSelect.value,
            'FECHA': fechaCierreInput.value,
            'Profesional': profesionalInput.value,
            'Apellido_Nombre': `${pacienteApellidoInput.value} ${pacienteNombreInput.value}`
        };

        // Recolectar Preguntas (Inputs dinámicos)
        const allDynamicInputs = cierreForm.querySelectorAll('input, select, textarea');
        let allValid = true;
        
        allDynamicInputs.forEach(input => {
            // Verificar obligatorios solo si no es botón de navegación
            if(input.required && !input.value.trim()) allValid = false;
            formData[input.name] = input.value.trim();
        });

        if (!formData['Efector'] || !formData['Apellido']) {
            alert("Error: Faltan datos del paciente. Por favor edite los datos.");
            return;
        }

        if (!allValid) {
            alert('Faltan completar preguntas obligatorias.');
            return;
        }

        guardarCierreBtn.disabled = true;
        guardarCierreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

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
            console.error(error);
            alert('Error de conexión.');
        } finally {
            guardarCierreBtn.disabled = false;
            guardarCierreBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Guardar Cierre Pediatría';
        }
    });

    function resetForm() {
        dniInput.value = '';
        efectorInput.value = '';
        pacienteApellidoInput.value = '';
        pacienteNombreInput.value = '';
        pacienteEdadInput.value = '';
        pacienteSexoSelect.value = '';
        
        currentPatientDNI = null;
        formStepsContainer.innerHTML = '';
        
        // Volver a Pantalla Cero
        searchSection.classList.remove('hidden');
        patientDataSection.classList.add('hidden');
        cierreForm.classList.add('hidden');
        btnCancelarContainer.classList.add('hidden');
        cargarDatosBtn.disabled = true;
    }

    cancelarCierreBtn.addEventListener('click', () => {
        if (confirm('¿Cancelar carga actual?')) resetForm();
    });

    // Estudios Modal
    async function mostrarEstudiosModal(dni, tipo) {
        estudiosModalContent.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin text-2xl"></i> Buscando...</div>';
        modalDNI.textContent = dni;
        estudiosModal.classList.remove('hidden');

        try {
            const response = await fetch(`/api/estudios/${dni}/${tipo}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                let html = '';
                result.data.forEach((study, idx) => {
                    html += `<div class="border-b p-3 mb-2 bg-gray-50 rounded">
                        <div class="font-bold text-blue-800 mb-1">Resultado #${idx+1} (${study.Fecha || ''})</div>
                        <div class="text-sm grid grid-cols-1 gap-1">`;
                    
                    Object.entries(study).forEach(([k, v]) => {
                        if (!v || k.includes('PDF') || k === 'DNI') return;
                        html += `<div><span class="font-semibold">${k}:</span> ${v}</div>`;
                    });
                    
                    const link = study['Link a PDF'] || study['LinkPDF'] || study['URL PDF'];
                    if (link) {
                        html += `<div class="mt-2"><a href="${link}" target="_blank" class="text-red-600 font-bold text-xs hover:underline"><i class="fas fa-file-pdf"></i> Ver PDF</a></div>`;
                    }
                    html += `</div></div>`;
                });
                estudiosModalContent.innerHTML = html;
            } else {
                estudiosModalContent.innerHTML = '<div class="text-center p-4 text-gray-500">No hay registros.</div>';
            }
        } catch (error) {
            estudiosModalContent.innerHTML = '<div class="text-center p-4 text-red-500">Error de conexión.</div>';
        }
    }

    closeModalBtn.addEventListener('click', () => estudiosModal.classList.add('hidden'));
    modalCloseButtonBottom.addEventListener('click', () => estudiosModal.classList.add('hidden'));
});