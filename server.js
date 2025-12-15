require('dotenv').config();
const v8 = require('v8');
v8.setFlagsFromString('--max-old-space-size=8192'); // 8GB

// Limitar el tamaño del heap de Node.js
const heapSizeLimit = 8192 * 1024 * 1024; // 8GB en bytes
if (process.memoryUsage().heapTotal > heapSizeLimit) {
    console.warn('⚠️  Memoria cerca del límite, forzando garbage collection');
    global.gc();
}

// Garbage collection automático cada 30 segundos
setInterval(() => {
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection ejecutado');
    }
}, 30000);


const express = require('express');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = '15YPfBG9PBfN3nBW5xXJYjIXEgYIS9z71pI0VpeCtAAU';
// >>>>> CAMBIO 1: AGREGAR ID PARA IAPOS <<<<<
const IAPOS_SPREADSHEET_ID = '1-bhfGB0FqGqWv_fIxPL4eN89o30F-BGZj6loLw3lTzg';

const API_BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;


// --- VARIABLES GLOBALES PARA LOS DOCUMENTOS ---
let doc; 
let credentials;     // Documento principal de Pacientes
let iaposDoc; // Nuevo documento para IAPOS
let isSheetsReady = false;


// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// >>>>> AGREGAR TODO ESTO AQUÍ ABAJO <<<<<
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// ====================================================================
// FUNCIONES DE CONEXIÓN Y UTILIDAD (Credenciales de Service Account)
// ====================================================================

/**
 * Obtiene y procesa las credenciales del Service Account desde las variables de entorno 
 * (GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY).
 */
async function getClientCredentials() {
    // Busca las credenciales en el entorno de Render (o local)
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? 
                       // Reemplaza la secuencia de escape para que funcione con Node.js
                        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

    if (clientEmail && privateKey) {
        return {
            client_email: clientEmail,
            private_key: privateKey,
        };
    } else {
        // Este error indica que faltan las credenciales para la cuenta de servicio,
        // lo que impide la conexión a Google Sheets.
        throw new Error('Credenciales de Google Service Account (email/key) no configuradas en el entorno. Asegúrese de definir GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY.');
    }
}


// >>>>> CAMBIO 4: ACEPTA UN ARGUMENTO OPCIONAL DE DOCUMENTO <<<<<
// Por defecto, usa el documento principal (doc)
async function getUltraOptimizedSheetData(docToUse = doc, sheetIdentifier, filters = {}) {
    if (!docToUse) throw new Error('Google Sheet no inicializado. El documento no existe.');
    
    let sheet;
    // La lógica de búsqueda de hoja no cambia
    if (typeof sheetIdentifier === 'string') sheet = docToUse.sheetsByTitle[sheetIdentifier];
    else if (typeof sheetIdentifier === 'number') sheet = docToUse.sheetsByIndex[sheetIdentifier];
    
    if (!sheet) {
        console.warn(`Hoja "${sheetIdentifier}" no encontrada en el documento`);
        return [];
    }

    // ✅ OPTIMIZACIÓN CRÍTICA: Cargar SOLO las columnas necesarias
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    // Filtrar MUY eficientemente
    return rows
        .filter(row => {
            if (!filters.dni) return true;
            const rowDni = String(row['DNI'] || row['Documento'] || '').trim();
            return rowDni === String(filters.dni).trim();
        })
        .map(row => {
            const rowData = {};
            // ✅ Solo incluir campos esenciales
            const essentialFields = ['DNI', 'Documento', 'Nombre', 'Apellido', 'Fecha', 'Prestador', 'Resultado'];
            sheet.headerValues.forEach(header => {
                if (essentialFields.includes(header) || header.includes('Link') || header.includes('PDF')) {
                    rowData[header] = row[header] || '';
                }
            });
            return rowData;
        });
}


// --- CONFIGURACIÓN DE MIDDLEWARE GENERAL ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public')); // Sirve archivos estáticos desde la carpeta 'public'



// --- CONFIGURACIÓN DE MIDDLEWARE PARA AUTENTICACIÓN ---
app.use(session({
    secret: 'tu-secreto-seguro', // Cambia esto por una cadena de caracteres única y segura
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// --- RUTAS DE AUTENTICACIÓN ---
app.get('/auth/google',
    // Usa la opción 'state' para guardar la URL de la página actual
    (req, res, next) => {
        req.session.returnTo = req.query.returnTo || '/';
        next();
    },
    passport.authenticate('google', { scope: ['profile', 'email'] })
);


app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        // Redirige al usuario a la URL que intentaba acceder originalmente
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo; // Limpia la variable de sesión
        res.redirect(redirectUrl);
    }
);

// --- ESTRATEGIA DE AUTENTICACIÓN DE GOOGLE ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    // Aquí puedes procesar el perfil del usuario de Google
    // Por ejemplo, puedes buscar si el correo del profesional existe en una lista de usuarios autorizados.
    return done(null, profile);
}));

// Funciones para serializar y deserializar el usuario en la sesión
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Middleware para verificar autenticación
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // Redirige a la página de login si no está autenticado
    res.redirect(`/login.html?returnTo=${encodeURIComponent(req.originalUrl)}`);
}


// Agrega esta nueva ruta en tu server.js, junto a tus otras rutas.
// Asegúrate de que esta ruta esté antes de app.use(express.static('public')).
app.get('/cierre-formulario.html', (req, res) => {
    // Si el usuario está autenticado, sirve el archivo HTML desde la carpeta privada
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'private', 'cierre-formulario.html'));
    } else {
        // Si no está autenticado, lo redirige al login de Google, pasando la URL actual
        res.redirect('/auth/google?returnTo=/cierre-formulario.html');
    }
});

app.get('/consultas.html', (req, res) => {
    // Verifica si el usuario está autenticado
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'private', 'consultas.html'));
    } else {
        // Si no está autenticado, redirige a la página de inicio de sesión de Google, pasando la URL actual
        res.redirect('/auth/google?returnTo=/consultas.html');
    }
});
// --- MIDDLEWARE ---
// Nueva ruta para que el frontend obtenga la URL base de la API
app.get('/api/config', (req, res) => {
    res.json({ apiBaseUrl: API_BASE_URL });
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en ${API_BASE_URL}`);
});

app.post('/api/enfermeria/guardar', async (req, res) => {
    try {
        // La conexión ya está inicializada al arrancar el servidor
        // No necesitas la línea "if (!doc) { await initializeGoogleSheet(); }"
        
        const sheet = doc.sheetsByTitle["Enfermeria"];
        if (!sheet) {
            return res.status(500).json({ message: 'Hoja de cálculo "Enfermeria" no encontrada.' });
        }

        const newRow = req.body;
        // >>>>> AGREGAR ESTA LÍNEA <<<<<
        newRow['Fecha_cierre_Enf'] = new Date().toLocaleDateString('es-AR');
        await sheet.addRow(newRow);

        res.status(200).json({ message: 'Datos guardados correctamente.' });
    } catch (error) {
        console.error('Error al guardar datos de enfermería:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
// --- RUTA DE GUARDADO (CONECTADA A LA NUEVA HOJA VIA APPS SCRIPT) ---
app.post('/api/cierre-pediatria/guardar', async (req, res) => {
    
    // 1. Verificación de Seguridad
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: "Usuario no autenticado." });
    }

    // 2. Obtener la URL del Script desde el archivo .env
    const scriptUrl = process.env.URL_SCRIPT_PEDIATRIA;

    if (!scriptUrl) {
        console.error("ERROR CRÍTICO: No se encontró URL_SCRIPT_PEDIATRIA en el archivo .env");
        return res.status(500).json({ success: false, error: "Error de configuración del servidor (Falta URL)." });
    }

    try {
        const formData = req.body;
        const nombreProfesional = req.user.displayName || formData['Profesional'] || 'Desconocido';

        // 3. Procesar Nombre y Apellido (Manteniendo tu lógica original)
        const nombreCompleto = (formData['Apellido_Nombre'] || '').trim();
        const primerEspacio = nombreCompleto.indexOf(' ');
        let apellido = nombreCompleto;
        let nombre = '';
        
        // Si vienen separados en el formData, usamos esos, sino los separamos del completo
        if (formData['Apellido'] && formData['Nombre']) {
            apellido = formData['Apellido'];
            nombre = formData['Nombre'];
        } else if (primerEspacio > 0) {
            apellido = nombreCompleto.substring(0, primerEspacio);
            nombre = nombreCompleto.substring(primerEspacio + 1);
        }

        // 4. Preparar el paquete de datos para enviar a Google
        const payload = {
            ...formData,
            'Profesional': nombreProfesional,
            'Apellido': apellido, 
            'Nombre': nombre
        };

        console.log("Enviando datos a Apps Script...");

        // 5. ENVÍO A LA NUEVA HOJA (Usando fetch al Script)
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // 6. Respuesta al Frontend
        if (result.success) {
            res.json({ success: true, message: "Ficha guardada exitosamente en la nueva base de datos." });
        } else {
            console.error("Google Script respondió con error:", result.error);
            throw new Error(result.error || "Error desconocido al guardar en Google.");
        }

    } catch (error) {
        console.error("Error al guardar cierre pediatría:", error);
        res.status(500).json({ success: false, error: "Error interno al guardar.", details: error.message });
    }
});

// Función para inicializar el documento de Google Sheet y cargar su información (SOLO UNA VEZ)
async function initializeGoogleSheet() {
    try {
        doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        
        if (process.env.CREDENTIALS_JSON) {
            credentials = JSON.parse(process.env.CREDENTIALS_JSON);
        } else {
            credentials = require('./credentials.json');
        }

        await doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key.replace(/\\n/g, '\n'),
        });
        await doc.loadInfo();
        console.log('✅ Google Sheet document loaded successfully.');
    } catch (error) {
        console.error('❌ Error initializing Google Sheet document:', error);
        throw error; // Re-lanza el error para que el servidor no arranque si falla la conexión
    }
}


// >>>>> CAMBIO 3: NUEVA FUNCIÓN DE INICIALIZACIÓN PARA IAPOS <<<<<
async function initializeIaposSheet() {
    try {
        iaposDoc = new GoogleSpreadsheet(IAPOS_SPREADSHEET_ID, await getClientCredentials());
        await iaposDoc.loadInfo(); // Carga la metadata del archivo de IAPOS
        console.log(`Documento IAPOS cargado: "${iaposDoc.title}"`);
    } catch (error) {
        console.error('Error al inicializar el documento IAPOS:', error.message);
        // Si falla, el servidor sigue vivo, pero las búsquedas de IAPOS fallarán.
    }
}


// Inicialización de ambos Sheets (Ejecutar en app.listen)
async function initializeAllSheets() {
    await initializeGoogleSheet();
    await initializeIaposSheet(); // <-- Inicializa el documento IAPOS
    isSheetsReady = true;
}

// Función para obtener todos los datos de una hoja específica (por nombre o índice)
// Usaremos esta función para ambas: la hoja principal y las hojas de estudios.
async function getDataFromSpecificSheet(sheetIdentifier) { // sheetIdentifier puede ser el nombre o el índice
    if (!doc) {
        throw new Error('Google Sheet document not initialized. Call initializeGoogleSheet() first.');
    }
    try {
        let sheet;
        if (typeof sheetIdentifier === 'string') {
            sheet = doc.sheetsByTitle[sheetIdentifier]; // Busca por nombre
        } else if (typeof sheetIdentifier === 'number') {
            sheet = doc.sheetsByIndex[sheetIdentifier]; // Busca por índice
        }

        if (!sheet) {
            console.warn(`Hoja "${sheetIdentifier}" no encontrada en el documento.`);
            return [];
        }

        await sheet.loadHeaderRow(); // Carga la fila de encabezados de esta hoja
        const rows = await sheet.getRows(); // Obtiene todas las filas de datos

        const allData = rows.map(row => {
            const rowData = {};
            sheet.headerValues.forEach(header => {
                // Maneja valores nulos o indefinidos, devolviendo una cadena vacía
                rowData[header] = row[header] || '';
            });
            return rowData;
        });
        return allData;
    } catch (error) {
        console.error(`Error al leer la hoja de cálculo "${sheetIdentifier}":`, error);
        throw error; // Re-lanza el error para que sea manejado por la ruta que la llamó
    }
}

async function uploadFileToDrive(fileBuffer, fileName, mimeType) {
    const FOLDER_ID = '1JhWxc3eFhZaT3edEjiUM-vHY4Y9MgVy-';

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key.replace(/\\n/g, '\n'),
        },
        // The scopes must be changed to allow writing to shared folders.
        scopes: ['https://www.googleapis.com/auth/drive'], 
    });

    const drive = google.drive({ version: 'v3', auth });
    const fileStream = streamifier.createReadStream(fileBuffer);
    
    const fileMetadata = {
        name: fileName,
        mimeType: mimeType,
        parents: [FOLDER_ID],
    };

    const media = {
        mimeType: mimeType,
        body: fileStream,
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
    });

    return response.data.webViewLink;
}

// ====================================================================
// RUTAS EXISTENTES - ADAPTADAS PARA USAR EL OBJETO 'doc' GLOBAL
// Y la nueva función 'getDataFromSpecificSheet'
// ====================================================================

// Ruta para obtener todos los campos (para el selector), excluyendo los de observaciones
app.get('/obtener-campos', async (req, res) => {
    try {
        // Asumimos que los campos a filtrar están en la primera hoja (índice 0)
        const data = await getDataFromSpecificSheet(0);
        if (data && data.length > 0) {
            const headers = Object.keys(data[0]).filter(header => !header.startsWith('Observaciones'));
            res.json(headers);
        } else {
            res.status(404).send('No se encontraron datos en la hoja principal.');
        }
    } catch (error) {
        console.error('Error al obtener los campos:', error);
        res.status(500).send('Error al obtener los campos.');
    }
});

// Nueva ruta para obtener todas las opciones únicas de un campo específico
app.get('/obtener-opciones-campo/:campo', async (req, res) => {
    const campo = req.params.campo;
    try {
        // Asumimos que las opciones están en la primera hoja (índice 0)
        const allData = await getDataFromSpecificSheet(0);
        // Obtiene valores únicos y elimina los vacíos o nulos (filter(Boolean))
        const opcionesUnicas = [...new Set(allData.map(item => item[campo]).filter(Boolean))];
        res.json(opcionesUnicas);
    } catch (error) {
        console.error(`Error al obtener las opciones para el campo ${campo}:`, error);
        res.status(500).json({ error: `Error al obtener las opciones para el campo ${campo}`, details: error.message });
    }
});

// --- RUTA PRINCIPAL DE BÚSQUEDA - /buscar ---
app.post('/buscar', async (req, res) => {
    try {
        const allData = await getDataFromSpecificSheet(0); // Suponiendo que los datos del Día Preventivo están en la hoja 0
        const dniABuscar = String(req.body.dni).trim();

        const NOMBRE_COLUMNA_FECHA = 'Fecha_cierre_DP'; // Asegúrate de que este es el nombre exacto de la columna de fecha

        const parseDateDDMMYYYY = (dateString) => {
            if (!dateString) return new Date(NaN);
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; 
                const year = parseInt(parts[2], 10);
                if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date(NaN);
                return new Date(year, month, day);
            }
            return new Date(NaN);
        };

        // 1. Filtrar TODOS los registros para el DNI
        const resultadosParaDNI = allData.filter(patient =>
            String(patient['DNI'] || patient['Documento'] || '').trim() === dniABuscar
        );

        if (resultadosParaDNI.length === 0) {
            console.log(`SERVER: DNI ${dniABuscar} no encontrado.`);
            // Cuando no se encuentra, devolvemos un objeto con 'error'
            return res.json({ error: 'DNI no encontrado.' }); 
        }

        // 2. Ordenar los resultados por fecha (más reciente primero)
        resultadosParaDNI.sort((a, b) => {
            const dateA = parseDateDDMMYYYY(a[NOMBRE_COLUMNA_FECHA]);
            const dateB = parseDateDDMMYYYY(b[NOMBRE_COLUMNA_FECHA]);

            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;

            return dateB.getTime() - dateA.getTime(); 
        });

        // ====================================================================
// RUTA NUEVA PARA LA HOJA IAPOS
// ====================================================================

// Ruta para buscar registros en la hoja específica "hoja_iapos"
app.post('/api/iapos/buscar', async (req, res) => {
    try {
        const dniABuscar = String(req.body.dni).trim();
        const NOMBRE_HOJA = "hoja_iapos";
        
        // Usamos la función optimizada, pasando el nombre de la hoja y el filtro DNI
        const resultadosIapos = await getUltraOptimizedSheetData(NOMBRE_HOJA, { dni: dniABuscar });

        if (resultadosIapos.length === 0) {
            console.log(`SERVER (${NOMBRE_HOJA}): DNI ${dniABuscar} no encontrado.`);
            return res.json({ error: `DNI no encontrado en la hoja ${NOMBRE_HOJA}.` });
        }

        console.log(`SERVER (${NOMBRE_HOJA}): DNI ${dniABuscar} encontrado. Enviando ${resultadosIapos.length} registros.`);

        // Por defecto, devolvemos el array completo de resultados encontrados
        res.json({
            registrosIapos: resultadosIapos,
            // Si necesitas el primer registro como principal:
            registroPrincipal: resultadosIapos[0] 
        });

    } catch (error) {
        console.error(`Error en servidor al buscar paciente IAPOS en ${NOMBRE_HOJA} por DNI:`, error);
        res.status(500).json({
            error: `Error interno del servidor al buscar en ${NOMBRE_HOJA}`,
            details: error.message
        });
    }
});

        // El primer elemento es el más reciente (el que se mostrará como principal)
        const pacientePrincipal = resultadosParaDNI[0];
        
        // Los estudios previos son todos los demás, si existen.
        // Mapeamos solo la fecha para el cartel informativo.
        const estudiosPrevios = resultadosParaDNI.slice(1).map(estudio => ({
            fecha: estudio[NOMBRE_COLUMNA_FECHA] || 'Fecha desconocida'
        }));

        console.log(`SERVER: DNI ${dniABuscar} encontrado. Enviando el más reciente y ${estudiosPrevios.length} estudios previos.`);

        // 3. ¡LA CLAVE! Enviamos un objeto con dos propiedades claras.
        // Esto evita que tu frontend se confunda sobre dónde están los datos principales.
        res.json({
            pacientePrincipal: pacientePrincipal,
            estudiosPrevios: estudiosPrevios
        });

    } catch (error) {
        console.error('Error en servidor al buscar paciente por DNI:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// Ruta para consultas grupales (usada en estadisticas.html)
app.post('/consultar-grupo', async (req, res) => {
    try {
        const { conditions, combinator = 'AND', fieldsToRetrieve = [] } = req.body;

        // Obtener todos los datos de la hoja principal (índice 0)
        const allData = await getDataFromSpecificSheet(0);
        const totalRegistros = allData.length;
        let filteredResults;

        if (combinator === 'AND') {
            filteredResults = allData.filter(patient => {
                return conditions.every(condition => {
                    const patientValue = patient[condition.field];
                    const conditionValue = condition.value;
                    const operator = condition.operator;

                    switch (operator) {
                        case 'equals':
                            return String(patientValue || '').trim() === String(conditionValue || '').trim();
                        case 'notEquals':
                            return String(patientValue || '').trim() !== String(conditionValue || '').trim();
                        case 'greaterThan':
                            return Number(patientValue) > Number(conditionValue);
                        case 'greaterThanOrEqual':
                            return Number(patientValue) >= Number(conditionValue);
                        case 'lessThan':
                            return Number(patientValue) < Number(conditionValue);
                        case 'lessThanOrEqual':
                            return Number(patientValue) <= Number(conditionValue);
                        case 'includes':
                            return String(patientValue || '').toLowerCase().includes(String(conditionValue || '').toLowerCase());
                        case 'in':
                            if (Array.isArray(conditionValue)) {
                                return conditionValue.some(val => String(patientValue || '').trim() === String(val || '').trim());
                            }
                            return false;
                        default:
                            return false;
                    }
                });
            });
        } else if (combinator === 'OR') {
            filteredResults = allData.filter(patient => {
                return conditions.some(condition => {
                    const patientValue = patient[condition.field];
                    const conditionValue = condition.value;
                    const operator = condition.operator;

                    switch (operator) {
                        case 'equals':
                            return String(patientValue || '').trim() === String(conditionValue || '').trim();
                        case 'notEquals':
                            return String(patientValue || '').trim() !== String(conditionValue || '').trim();
                        case 'greaterThan':
                            return Number(patientValue) > Number(conditionValue);
                        case 'greaterThanOrEqual':
                            return Number(patientValue) >= Number(conditionValue);
                        case 'lessThan':
                            return Number(patientValue) < Number(conditionValue);
                        case 'lessThanOrEqual':
                            return Number(patientValue) <= Number(conditionValue);
                        case 'includes':
                            return String(patientValue || '').toLowerCase().includes(String(conditionValue || '').toLowerCase());
                        case 'in':
                            if (Array.isArray(conditionValue)) {
                                return conditionValue.some(val => String(patientValue || '').trim() === String(val || '').trim());
                            }
                            return false;
                        default:
                            return false;
                    }
                });
            });
        } else {
            filteredResults = []; // Si no se especifica el combinador
        }

        const conteoCruce = filteredResults.length;
        const criteriosCruce = {};
        conditions.forEach(condition => {
            criteriosCruce[condition.field] = condition.value;
        });

        res.json({
            total_registros: totalRegistros,
            conteo_cruce: conteoCruce,
            criterios_cruce: criteriosCruce,
            data: filteredResults // Incluimos el array completo de filteredResults para la exportación
        });

    } catch (error) {
        console.error('Error al realizar la consulta grupal:', error);
        res.status(500).json({ error: 'Error al realizar la consulta' });
    }
});

app.get('/obtener-resultados-variable/:variable', async (req, res) => {
    const variable = req.params.variable;
    try {
        // Obtener datos de la hoja principal (índice 0)
        const data = await getDataFromSpecificSheet(0);
        if (data && data.length > 0 && data[0].hasOwnProperty(variable)) {
            const resultadosUnicos = [...new Set(data.map(row => row[variable]).filter(value => value !== ''))];
            res.json(resultadosUnicos);
        } else {
            res.status(404).send(`Variable "${variable}" no encontrada o sin datos.`);
        }
    } catch (error) {
        console.error(`Error al obtener los resultados para la variable "${variable}":`, error);
        res.status(500).send(`Error al obtener los resultados para la variable "${variable}".`);
    }
});

// Agrega esta nueva ruta GET en tu server.js, junto a tus otras rutas
app.get('/api/user', (req, res) => {
    // Si el usuario está autenticado, req.isAuthenticated() será verdadero
    if (req.isAuthenticated()) {
        res.json({
            isLoggedIn: true,
            user: {
                name: req.user.displayName,
                email: req.user.emails[0].value
            }
        });
    } else {
        res.json({
            isLoggedIn: false
        });
    }
});
// Ruta para servir el HTML de Cierre Pediatría
app.get('/cierre-pediatria', (req, res) => {
    // Verificar si el usuario ya inició sesión
    if (req.isAuthenticated()) {
        // Si el archivo está en la misma carpeta que server.js:
        res.sendFile(path.join(__dirname, 'cierre_pediatria.html'));
        
        // OJO: Si moviste el archivo a la carpeta 'public', usa esta línea en su lugar:
        // res.sendFile(path.join(__dirname, 'public', 'cierre_pediatria.html'));
    } else {
        // Si NO está logueado, redirigir al login de Google
        // y configurar para que vuelva a esta página al terminar
        res.redirect('/auth/google?returnTo=/cierre-pediatria');
    }
});

// ====================================================================
// NUEVA RUTA - OBTENER ESTUDIOS COMPLEMENTARIOS POR DNI
// ====================================================================
app.post('/obtener-estudios-paciente', async (req, res) => {
    try {
        const { dni } = req.body;
        if (!dni) {
            return res.status(400).json({ error: 'DNI del paciente es requerido.' });
        }

        const estudiosEncontrados = [];
        // >>>>>>>> ATENCIÓN <<<<<<<<
        // MUY IMPORTANTE: Asegúrate que estos nombres de hojas coincidan EXACTAMENTE
        // con los nombres de las pestañas (hojas) en tu archivo de Google Sheets
        const hojasDeEstudios = [
            'Mamografia',
            'Laboratorio', // ¡Aquí está tu hoja de laboratorio!
            'Ecografia',
            'Espirometria',
            'Densitometria',
            'VCC',
            'Biopsia',
            'Odontologia',
            'Enfermeria',
            'Eco mamaria',
            'Oftalmologia'
        ];

        // >>>>>>>> NUEVO: Definición de campos específicos para     la hoja de Laboratorio <<<<<<<<
        // ESTOS DEBEN COINCIDIR EXACTAMENTE CON LOS ENCABEZADOS DE LAS COLUMNAS EN TU HOJA 'Laboratorio'
        const camposLaboratorio = [
            'Glucemia',
            'Creatinina',
            'Indice de Filtracion Glomerular', // Asegúrate de que el espacio y tildes sean exactos
            'Colesterol Total',
            'Colesterol HDL',
            'Colesterol LDL',
            'Trigliceridos',
            'HIV',
            'SOMF',
            'Hepatitis B antigeno de superficie',
            'Hepatitis C Ac. Totales',
            'Hepatitis B AC anti core total',
            'HPV OTROS GENOTIPOS DE ALTO RIESGO',
            'HPV GENOTIPO 18',
            'HPV GENOTIPO 16',
            'VDRL',
            'PSA',
            'Chagas (HAI)',
            'Chagas (ECLIA)',
            'Hemoglobina Glicosilada',
            'Microalbuminuria',
            'Proteinuria',
            'clearance de depuracion Creatinina'
        ];

        // Itera sobre cada hoja de estudio definida
        for (const sheetName of hojasDeEstudios) {
            try {
                // Obtiene los datos de la hoja de estudio actual
                const sheetData = await getDataFromSpecificSheet(sheetName);

                // Filtra los estudios de esa hoja para encontrar los que coincidan con el DNI
                const estudiosPacienteEnHoja = sheetData.filter(row => {
                    // Asumimos que la columna del DNI en TODAS TUS HOJAS DE ESTUDIOS se llama 'DNI'.
                    // Si en alguna hoja se llama diferente (ej: 'Documento'), ajústalo aquí.
                    return String(row['DNI'] || '').trim() === String(dni).trim();
                });

                // Añade los estudios encontrados de esta hoja a la lista global
                estudiosPacienteEnHoja.forEach(estudio => {
                    // >>>>>>>> LÓGICA CONDICIONAL: DIFERENCIAR LABORATORY DE OTROS ESTUDIOS <<<<<<<<
                    if (sheetName === 'Laboratorio') {
                        const labResultados = {};
                        camposLaboratorio.forEach(campo => {
                            // Si el campo existe en la fila de Google Sheets, úsalo; de lo contrario, 'N/A'
                            labResultados[campo] = estudio[campo] !== undefined ? estudio[campo] : 'N/A';
                        });
                        
                        estudiosEncontrados.push({
                            TipoEstudio: sheetName, // Será 'Laboratorio'
                            DNI: estudio['DNI'] || 'N/A',
                            Nombre: estudio['Nombre'] || 'N/A',
                            Apellido: estudio['Apellido'] || 'N/A',
                            Fecha: estudio['Fecha'] || 'N/A',
                            Prestador: estudio['Prestador'] || 'N/A',
                            LinkPDF: estudio['LinkPDF'] || '' ,
                            // >>>>>>>> IMPORTANTE: Para Laboratorio, enviamos los resultados específicos <<<<<<<<
                            ResultadosLaboratorio: labResultados // Objeto con todos los resultados de laboratorio
                        });

                                 // --- NUEVA LÓGICA PARA LA HOJA 'Enfermeria' ---
                    } else if (sheetName === 'Enfermeria') {
                        // Obtenemos los campos específicos de Enfermeria
                        const datosEnfermeria = {
                         // Los nombres de la izquierda son los que el frontend espera (app.js)
                        // Los nombres de la derecha son los nombres de las columnas en tu Google Sheet
                            'Altura': estudio['Altura (cm)'] || 'N/A',
                            'Peso': estudio['Peso (kg)'] || 'N/A',
                            'Circunferencia_cintura': estudio['Circunferencia de cintura (cm)'] || 'N/A',
                            'Presion_Arterial': estudio['Presion Arterial (mmhg)'] || 'N/A',
                            'Vacunas': estudio['Vacunas'] || 'N/A',
                            'AgudezaVisual': estudio['Agudeza Visual'] || estudio['Agudeza Visual (Enlace a PDF)'] || 'N/A',
                            'Espirometria_PDF': estudio['Espirometria (Enlace a PDF)'] || '',
                            'Fecha_cierre_Enf': estudio['Fecha_cierre_Enf'] || 'N/A'
                        };

                         // Consolidamos toda la información en un solo objeto para el frontend
                        estudiosEncontrados.push({
                            TipoEstudio: sheetName,
                            DNI: estudio['DNI'] || 'N/A',
                            Nombre: estudio['Nombre'] || 'N/A',
                            Apellido: estudio['Apellido'] || 'N/A',
                            Fecha: estudio['Fecha'] || 'N/A',
                            Prestador: estudio['Prestador'] || 'N/A',
                                // Ahora, 'ResultadosEnfermeria' contiene todos los campos necesarios.
                                 // El frontend ya no necesita acceder al objeto 'estudio' original.
                            ResultadosEnfermeria: datosEnfermeria
                        });


                    } else {
                        // Lógica para Mamografia, Ecografia, etc. (los que tienen Resultado y/o LinkPDF)
                        estudiosEncontrados.push({
                            TipoEstudio: sheetName,
                            DNI: estudio['DNI'] || 'N/A',
                            Nombre: estudio['Nombre'] || 'N/A',
                            Apellido: estudio['Apellido'] || 'N/A',
                            Fecha: estudio['Fecha'] || 'N/A',
                            Prestador: estudio['Prestador'] || 'N/A',
                            // Puedes añadir más opciones si la columna de resultado tiene variantes
                            Resultado: estudio['Resultado'] || estudio['Normal/Patologica'] || 'N/A',
                            // Aquí usamos el nombre de columna del link PDF que ya te funcionaba
                            LinkPDF: estudio['LinkPDF'] || '' // Vacío si no hay link
                            // Si tu LinkPDF venía de 'Link al PDF' o 'URL PDF', asegúrate de usar ese nombre aquí:
                            // LinkPDF: estudio['Link al PDF'] || estudio['URL PDF'] || estudio['LinkPDF'] || ''
                        });
                    }
                });

            } catch (sheetError) {
                console.warn(`⚠️ Error al procesar la hoja "${sheetName}" para DNI ${dni}: ${sheetError.message}`);
                // console.error(`Detalles del error para hoja ${sheetName}:`, sheetError); // Descomentar para depuración profunda
            }
        }

        // Responde al frontend con la lista de estudios encontrados o un mensaje de no encontrados
        if (estudiosEncontrados.length > 0) {
            res.json({ success: true, estudios: estudiosEncontrados });
        } else {
            res.json({ success: true, message: 'No se encontraron estudios complementarios para este DNI.', estudios: [] });
        }

    } catch (error) {
        // Esto capturará errores fatales fuera del bucle de hojas
        console.error('❌ Error fatal al obtener estudios del paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estudios.' });
    }
});

// ====================================================================
// NUEVA RUTA: OBTENER ESTUDIOS ESPECÍFICOS (SOLUCIÓN ERROR 404 PEDIATRÍA)
// ====================================================================
app.get('/api/estudios/:dni/:tipo', async (req, res) => {
    try {
        const { dni, tipo } = req.params;
        
        // Mapeo: Nombre que envía el botón -> Nombre exacto de la pestaña en Google Sheets
        const mapaPestanas = {
            'Enfermeria': 'Enfermeria',
            'Laboratorio': 'Laboratorio',
            'Odontologia': 'Odontologia',
            'Biopsia': 'Biopsia',
            'VCC': 'VCC',
            'Mamografia': 'Mamografia',
            'Eco mamaria': 'Eco mamaria',
            'Espirometria': 'Espirometria',
            'Ecografia': 'Ecografia',
            'Densitometria': 'Densitometria'
        };

        const nombreRealPestana = mapaPestanas[tipo];

        if (!nombreRealPestana) {
            return res.status(400).json({ success: false, error: `Tipo de estudio '${tipo}' no configurado.` });
        }

        // Reutilizamos tu función existente para leer la hoja
        const datosHoja = await getDataFromSpecificSheet(nombreRealPestana);

        // Filtramos por DNI
        const estudiosEncontrados = datosHoja.filter(fila => 
            String(fila['DNI'] || '').trim() === String(dni).trim()
        );

        res.json({ success: true, data: estudiosEncontrados });

    } catch (error) {
        console.error(`Error al buscar estudios de ${req.params.tipo}:`, error);
        res.status(500).json({ success: false, error: "Error interno al buscar estudios." });
    }
});

app.post('/api/seguimiento/guardar', async (req, res) => {
    const { fecha, profesional, paciente, evaluaciones, observacionProfesional, pdfLinks } = req.body;
    console.log(`SERVER: Recibido informe de seguimiento para DNI: ${paciente.dni} en fecha: ${fecha}`);

    if (!doc) {
        console.error('SERVER ERROR: Google Sheet document not initialized.');
        return res.status(500).json({ error: 'Error interno del servidor: Base de datos no disponible.' });
    }

    try {
        await doc.loadInfo();
        let sheetSeguimiento = doc.sheetsByTitle['Seguimiento'];

        if (!sheetSeguimiento) {
            console.log('SERVER: Creando nueva hoja "Seguimiento" en Google Sheet con encabezados predefinidos.');
            sheetSeguimiento = await doc.addSheet({
                title: 'Seguimiento',
                headerValues: [
                    'Fecha_Seguimiento', 'DNI_Paciente', 'Nombre_Paciente',
                    'Profesional_Apellido_Nombre', 'Profesional_Matricula',
                    'Riesgo_Cardiovascular_Calificacion', 'Riesgo_Cardiovascular_Observaciones',
                    'Diabetes_Calificacion', 'Diabetes_Observaciones',
                    'Dislipemia_Calificacion', 'Dislipemia_Observaciones',
                    'Tabaquismo_Calificacion', 'Tabaquismo_Observaciones',
                    'Actividad_fisica_Calificacion', 'Actividad_fisica_Observaciones',
                    'Observacion_Profesional', 'Links_PDFs'
                ]
            });
        }

        // *************************************************************************
        // ** ESTE CÓDIGO DEBE ESTAR DENTRO DE LA RUTA /api/seguimiento/guardar **
        // *************************************************************************
        const newRow = {
            Fecha_Seguimiento: fecha,
            DNI_Paciente: paciente.dni,
            Nombre_Paciente: paciente.nombre,
            Profesional_Apellido_Nombre: profesional.nombre,
            Profesional_Matricula: profesional.matricula,
            Observacion_Profesional: observacionProfesional,
            Links_PDFs: JSON.stringify(pdfLinks)
        };

        if (evaluaciones && evaluaciones.length > 0) {
            evaluaciones.forEach(eva=> {
                let motivoOriginal = eva.motivo;
                let motivoParaColumna = motivoOriginal;

                motivoParaColumna = motivoParaColumna.replace(/\s*\([^)]*\)\s*/g, ' ');
                motivoParaColumna = motivoParaColumna.replace(/\s*Se verifica\s*$/i, '');
                motivoParaColumna = motivoParaColumna.replace(/\s*Pendiente\s*$/i, '');
                motivoParaColumna = motivoParaColumna.replace(/\s*Riesgo Alto\s*$/i, '');

                if (motivoOriginal.includes('Control Odontológico')) {
                    motivoParaColumna = 'Control Odontologico';
                } else if (motivoOriginal.includes('Agudeza visual')) {
                    motivoParaColumna = 'Agudeza visual';
                } else if (motivoOriginal.includes('Seguridad Vial')) {
                    motivoParaColumna = 'Seguridad Vial';
                } else if (motivoOriginal === 'IMC') {
                    motivoParaColumna = 'IMC';
                }
                motivoParaColumna = motivoParaColumna.trim();

                let columnaBase = motivoParaColumna;
                columnaBase = columnaBase.replace(/\s+/g, '_');
                columnaBase = columnaBase.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                columnaBase = columnaBase.replace(/[^\w]/g, '');
                columnaBase = columnaBase.replace(/_+/g, '_');
                columnaBase = columnaBase.replace(/^_|_$/g, '');

                console.log(`SERVER DEBUG: Motivo original recibido: "${motivoOriginal}"`);
                console.log(`SERVER DEBUG: Motivo normalizado (para columna): "${motivoParaColumna}"`);
                console.log(`SERVER DEBUG: Nombre de columna sanitizado FINAL: "${columnaBase}"`);

                newRow[`${columnaBase}_Calificacion`] = eval.calificacion;
                newRow[`${columnaBase}_Observaciones`] = eval.observaciones;
            });
        }

        await sheetSeguimiento.addRow(newRow);

        console.log('SERVER: Informe de seguimiento guardado con éxito.');
        res.json({ success: true, message: 'Informe de seguimiento guardado.' });

    } catch (error) {
        console.error('SERVER ERROR: Fallo al guardar informe de seguimiento:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al guardar el informe de seguimiento.', details: error.message });
    }
}); // <--- ESTA ES LA LLAVE DE CIERRE CORRECTA PARA LA RUTA DE SEGUIMIENTO
// *************************************************************************
app.post('/api/cierre/guardar', async (req, res) => {
    // AHORA VERIFICA SI EL USUARIO ESTÁ AUTENTICADO
    if (!req.isAuthenticated()) {
        console.error('SERVER ERROR: Intento de guardar formulario de cierre sin autenticación.');
        return res.status(401).json({ success: false, error: 'Acceso no autorizado. Por favor, inicie sesión.' });
    }
    
    // OBTENEMOS EL NOMBRE DEL PROFESIONAL AUTENTICADO
    const profesionalName = req.user.displayName;

    const formData = req.body;
    
    const dni = String(formData['DNI']).trim();
    const fechaCierre = String(formData['Fecha_cierre_dp']).trim();

    if (!doc) {
        console.error('SERVER ERROR: Google Sheet document not initialized.');
        return res.status(500).json({ error: 'Error interno del servidor: Base de datos no disponible.' });
    }

    if (!dni || !fechaCierre) {
        return res.status(400).json({ success: false, error: 'DNI del paciente y Fecha de Cierre son requeridos para guardar el cierre.' });
    }

    try {
        await doc.loadInfo();
        const pacientesSheet = doc.sheetsByTitle['Hoja 1'];
        
        if (!pacientesSheet) {
            console.error('SERVER ERROR: Hoja "Hoja 1" no encontrada. Por favor, asegúrese de que la hoja exista y se llame "Hoja 1".');
            return res.status(500).json({ success: false, error: 'Error interno del servidor: La hoja de pacientes ("Hoja 1") no fue encontrada.' });
        }

        await pacientesSheet.loadHeaderRow();

        const newRowData = {};
        pacientesSheet.headerValues.forEach(header => {
            newRowData[header] = formData[header] !== undefined ? String(formData[header]) : '';
        });

        // ✅ AÑADIMOS EL NOMBRE DEL PROFESIONAL Y LA FECHA
        newRowData['Profesional'] = profesionalName;
        newRowData['Fecha_cierre_DP'] = new Date().toLocaleDateString('es-AR');
        
        // ✅ AQUÍ AGREGAMOS LOS NUEVOS CAMPOS DEL FORMULARIO
        newRowData['Cancer_mama_Eco_mamaria'] = formData['Cancer_mama_Eco_mamaria'];
        newRowData['Observaciones_Eco_mamaria'] = formData['Observaciones_Eco_mamaria'];

        newRowData['DNI'] = dni;
        newRowData['Fecha_cierre_dp'] = fechaCierre;

        await pacientesSheet.addRow(newRowData);

        console.log(`SERVER: Nuevo registro de cierre guardado para DNI: ${dni} por ${profesionalName}`);
        return res.json({ success: true, message: 'Formulario de cierre guardado exitosamente como nuevo registro.' });

    } catch (error) {
        console.error('SERVER ERROR: Fallo al guardar el formulario de cierre:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al guardar el formulario de cierre.', details: error.message });
    }
});
app.post('/guardar-consulta', async (req, res) => {
    console.log('Datos recibidos del cliente:', req.body);

    if (!req.isAuthenticated()) {
        console.error('SERVER ERROR: Intento de guardar consulta sin autenticación.');
        return res.status(401).json({ success: false, message: 'Acceso no autorizado. Por favor, inicie sesión.' });
    }

    const profesionalNombre = req.user.displayName; 

    console.log('Solicitud para guardar consulta recibida por el profesional:', profesionalNombre);

    const { 
        DNI, 
        Nombre, 
        Apellido, 
        Edad, 
        Sexo, 
        'motivo de consulta': motivoConsulta, 
        diagnostico, 
        indicaciones, 
        recordatorio 
    } = req.body;

    if (!DNI || !profesionalNombre) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios (DNI o Profesional).' });
    }

    try {
        // ✅ CLAVE: Usamos la variable 'doc' que ya está inicializada globalmente.
        // Las siguientes dos líneas son ELIMINADAS porque son la causa del error.
        // const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
        // await doc.useServiceAccountAuth(jwt);

        await doc.loadInfo();

        const sheetTitle = 'Consultas';
        let sheet = doc.sheetsByTitle[sheetTitle];

        if (!sheet) {
            console.log(`La hoja "${sheetTitle}" no existe. Creándola...`);
            sheet = await doc.addSheet({
                title: sheetTitle,
                headerValues: ['DNI', 'Nombre', 'Apellido', 'Edad', 'Sexo', 'Motivo de consulta', 'Diagnóstico', 'Indicaciones', 'Recordatorio', 'Profesional', 'Fecha'],
            });
        }
        
        await sheet.addRow({
            'DNI': DNI,
            'Nombre': Nombre,
            'Apellido': Apellido,
            'Edad': Edad,
            'Sexo': Sexo,
            'Motivo de consulta': motivoConsulta,
            'Diagnostico': diagnostico,
            'Indicaciones': indicaciones,
            'Recordatorio': recordatorio,
            'Profesional': profesionalNombre,
            'Fecha': new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
        });

        console.log('Datos de consulta guardados con éxito.');
        res.json({ success: true, message: 'Consulta guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la consulta:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
       // ====================================================================
// INICIO DEL SERVIDOR
// ====================================================================

// Función que inicializa AMBOS Sheets secuencialmente
async function initializeAllSheets() {
    try {
        await initializeGoogleSheet(); // Inicializa doc (Pacientes)
        await initializeIaposSheet(); // Inicializa iaposDoc (IAPOS)
        isSheetsReady = true;
        console.log('✅ Ambos documentos de Google Sheets inicializados correctamente.');
    } catch (error) {
        console.error('❌ Error fatal al inicializar uno o ambos Google Sheets:', error.message);
        // Propagamos el error para que el proceso de inicio se detenga
        throw error; 
    }
}


// Llama a la función de inicialización de Google Sheet una vez que el servidor arranca.
// El servidor no empezará a escuchar peticiones hasta que ambas conexiones estén listas.
initializeAllSheets().then(() => {
    // Si la inicialización fue exitosa, iniciamos el servidor
    app.listen(PORT, () => {
        console.log(`✅ Servidor funcionando en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('❌ Fallo al iniciar el servidor debido a un error de inicialización:', err);
    process.exit(1); // Sale si no se puede iniciar el servidor
});  