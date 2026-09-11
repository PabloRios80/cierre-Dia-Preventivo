// ====================================================================
// ENDPOINT: /obtener-estudios-paciente (VERSIÓN SUPABASE)
// Reemplaza los dos endpoints anteriores del mismo nombre.
// Lee TODOS los estudios desde Supabase (no Google Sheets).
// NO toca el guardado en Sheets ni el Apps Script de PDFs.
// ====================================================================

function registrarEndpointObtenerEstudios(app, supabase) {

    app.post('/obtener-estudios-paciente', async (req, res) => {
        const { dni } = req.body;
        if (!dni) return res.status(400).json({ error: 'DNI requerido.' });

        try {
            const estudiosEncontrados = [];

            // ── 1. LABORATORIO desde practicas_historicas ──
            // Tiene columnas individuales por determinación + link_pdf como array JSON
            const { data: laboratorios } = await supabase
                .from('practicas_historicas')
                .select('*')
                .eq('dni', dni)
                .eq('tipo_practica', 'laboratorio')
                .order('fecha', { ascending: false });

            (laboratorios || []).forEach(lab => {
                // Parsear link_pdf (puede ser array JSON o string simple)
                let links = [];
                try {
                    const parsed = JSON.parse(lab.link_pdf || '[]');
                    links = Array.isArray(parsed) ? parsed : [parsed];
                } catch(e) {
                    if (lab.link_pdf) links = [lab.link_pdf];
                }

                estudiosEncontrados.push({
                    TipoEstudio: 'Laboratorio',
                    DNI: lab.dni,
                    Nombre: lab.nombre || '',
                    Apellido: lab.apellido || '',
                    Fecha: lab.fecha || '',
                    Prestador: lab.prestador || '',
                    LinkPDF: links[0] || '',
                    LinksPDF: links, // array completo para mostrar múltiples botones
                    // PDFs específicos por práctica individual (si existen).
                    // Cuando una práctica no tiene entrada acá, corresponde
                    // usar el PDF general (LinkPDF/LinksPDF) de arriba.
                    LinkPdfPorPractica: lab.link_pdf_por_practica || {},
                    ResultadosLaboratorio: {
                        'Glucemia':                          lab.glucemia || '',
                        'Creatinina':                        lab.creatinina || '',
                        'Índice Filtrado Glomerular':        lab.indice_filtrado_glomerular || '',
                        'Colesterol Total':                  lab.colesterol_total || '',
                        'Colesterol HDL':                    lab.colesterol_hdl || '',
                        'Colesterol LDL':                    lab.colesterol_ldl || '',
                        'Triglicéridos':                     lab.trigliceridos || '',
                        'HIV':                               lab.hiv || '',
                        'SOMF':                              lab.somf || '',
                        'Hepatitis B Antígeno Superficie':   lab.hepatitis_b_antigeno || '',
                        'Hepatitis C':                       lab.hepatitis_c || '',
                        'Hepatitis B Anti Core':             lab.hepatitis_b_anti_core || '',
                        'HPV Genotipo 16':                   lab.hpv_genotipo_16 || '',
                        'HPV Genotipo 18':                   lab.hpv_genotipo_18 || '',
                        'HPV Otros Genotipos Alto Riesgo':   lab.hpv_otros || '',
                        'VDRL':                              lab.vdrl || '',
                        'PSA':                               lab.psa || '',
                        'Chagas HAI':                        lab.chagas_hai || '',
                        'Chagas ECLIA':                      lab.chagas_eclia || '',
                        'Hemoglobina Glicosilada':           lab.hemoglobina_glicosilada || '',
                        'Microalbuminuria':                  lab.microalbuminuria || '',
                        'Proteinuria':                       lab.proteinuria || '',
                        'Clearence Creatinina':              lab.clearence_creatinina || ''
                    },
                    // Mismo contenido que arriba, pero con las claves reales de la
                    // base (no los nombres "bonitos") — para que el frontend pueda
                    // filtrar con precisión qué columnas corresponden a cada campo
                    // del formulario, sin confundir HPV con Glucemia, por ejemplo.
                    ResultadosPorColumna: {
                        glucemia: lab.glucemia || '',
                        creatinina: lab.creatinina || '',
                        indice_filtrado_glomerular: lab.indice_filtrado_glomerular || '',
                        colesterol_total: lab.colesterol_total || '',
                        colesterol_hdl: lab.colesterol_hdl || '',
                        colesterol_ldl: lab.colesterol_ldl || '',
                        trigliceridos: lab.trigliceridos || '',
                        hiv: lab.hiv || '',
                        somf: lab.somf || '',
                        hepatitis_b_antigeno: lab.hepatitis_b_antigeno || '',
                        hepatitis_c: lab.hepatitis_c || '',
                        hepatitis_b_anti_core: lab.hepatitis_b_anti_core || '',
                        hpv_genotipo_16: lab.hpv_genotipo_16 || '',
                        hpv_genotipo_18: lab.hpv_genotipo_18 || '',
                        hpv_otros: lab.hpv_otros || '',
                        vdrl: lab.vdrl || '',
                        psa: lab.psa || '',
                        chagas_hai: lab.chagas_hai || '',
                        chagas_eclia: lab.chagas_eclia || '',
                        hemoglobina_glicosilada: lab.hemoglobina_glicosilada || '',
                        microalbuminuria: lab.microalbuminuria || '',
                        proteinuria: lab.proteinuria || '',
                        clearence_creatinina: lab.clearence_creatinina || '',
                    }
                });
            });

            // ── 2. ODONTOLOGÍA desde odontologia_consultas ──
            const { data: odonto } = await supabase
                .from('odontologia_consultas')
                .select('*')
                .eq('dni', dni)
                .order('created_at', { ascending: false });

            (odonto || []).forEach(o => {
                estudiosEncontrados.push({
                    TipoEstudio: 'Odontologia',
                    DNI: o.dni,
                    Nombre: o.nombre || '',
                    Apellido: o.apellido || '',
                    Fecha: o.fecha || '',
                    Prestador: o.odontologo || '',
                    LinkPDF: o.enlace_pdf || '',
                    Resultado: o.riesgo_evaluacion || o.riesgo_general || '',
                    Observaciones: o.observaciones || ''
                });
            });

            // ── 3. ENFERMERÍA desde enfermeria_consultas ──
            const { data: enfermeria } = await supabase
                .from('enfermeria_consultas')
                .select('*')
                .eq('dni', dni)
                .order('created_at', { ascending: false });

            (enfermeria || []).forEach(e => {
                estudiosEncontrados.push({
                    TipoEstudio: 'Enfermeria',
                    DNI: e.dni,
                    Nombre: e.nombre || '',
                    Apellido: e.apellido || '',
                    Fecha: e.fecha_cierre_enf || '',
                    Prestador: e.nombre_enfermera || '',
                    ResultadosEnfermeria: {
                        'Altura':                e.altura_cm ? String(e.altura_cm) : '',
                        'Peso':                  e.peso_kg ? String(e.peso_kg) : '',
                        'Circunferencia_cintura': e.circunferencia_cintura_cm ? String(e.circunferencia_cintura_cm) : '',
                        'Presion_Arterial':      e.presion_arterial || '',
                        'Vacunas':               e.vacunas || '',
                        'AgudezaVisual':         e.agudeza_visual || '',
                        'Espirometria_PDF':      e.espirometria_link || e.espirometria_pdf || ''
                    }
                });
            });

            // ── 4. RESTO DE PRÁCTICAS desde practicas_historicas ──
            // (mamografia, eco_mamaria, ecografia, densitometria, vcc,
            //  papanicolau, espirometria, biopsia, oftalmologia)
            const tiposOtros = [
                'mamografia', 'eco_mamaria', 'ecografia', 'densitometria',
                'vcc', 'papanicolau', 'espirometria', 'biopsia', 'oftalmologia'
            ];

            const { data: otrasHistoricas } = await supabase
                .from('practicas_historicas')
                .select('*')
                .eq('dni', dni)
                .in('tipo_practica', tiposOtros)
                .order('fecha', { ascending: false });

            (otrasHistoricas || []).forEach(p => {
                let links = [];
                try {
                    const parsed = JSON.parse(p.link_pdf || '[]');
                    links = Array.isArray(parsed) ? parsed : [parsed];
                } catch(e) {
                    if (p.link_pdf) links = [p.link_pdf];
                }

                const ETIQUETAS_TIPO = {
                    'mamografia':    'Mamografia',
                    'eco_mamaria':   'Eco mamaria',
                    'ecografia':     'Ecografia',
                    'densitometria': 'Densitometria',
                    'vcc':           'VCC',
                    'papanicolau':   'Papanicolau',
                    'espirometria':  'Espirometria',
                    'biopsia':       'Biopsia',
                    'oftalmologia':  'Oftalmologia'
                };

                estudiosEncontrados.push({
                    TipoEstudio: ETIQUETAS_TIPO[p.tipo_practica] || p.tipo_practica,
                    DNI: p.dni,
                    Nombre: p.nombre || '',
                    Apellido: p.apellido || '',
                    Fecha: p.fecha || '',
                    Prestador: p.prestador || '',
                    Resultado: p.resultado || '',
                    LinkPDF: links[0] || '',
                    LinksPDF: links
                });
            });

            // ── 5. PRÁCTICAS INDIVIDUALES desde practicas_autorizadas ──
            // Para prácticas cargadas individualmente desde Prestadores que aún
            // no tienen flujo nuevo (VCC, mamografía, ecografía, densitometría, etc.)
            // Excluimos laboratorio porque ya está cubierto por practicas_historicas
            const DESCRIPCIONES_LABORATORIO = [
                'glucemia', 'colesterol', 'creatinina', 'filtrado', 'trigliceridos',
                'anti_vih', 'hepatitis', 'chagas', 'vdrl', 'psa', 'hpv',
                'hemoglobina', 'microalbuminuria', 'proteinuria', 'clearence', 'somf',
                'anticuerpos anti_v', 'laboratorio'
            ];

            // Descripciones de acciones internas de facturación (módulos, cierres,
            // consultas propias) que ya se muestran completas desde su propia
            // fuente real (odontologia_consultas, enfermeria_consultas, etc.) y
            // NO deben aparecer acá de nuevo, ya que estas filas no tienen
            // resultado ni PDF adjunto — solo sirven para el cálculo de facturación.
            const DESCRIPCIONES_EXCLUIR_FACTURACION = [
                'consulta odontológica', 'consulta de enfermería',
                'consulta médica (día preventivo)', 'módulo día preventivo',
                'módulo extramódulo', 'módulo seguimiento', 'práctica bioquímica',
                'topicación', 'enseñanza técnica'
            ];

            const { data: practicasInd } = await supabase
                .from('practicas_autorizadas')
                .select('*')
                .eq('dni', dni)
                .eq('estado', 'REALIZADA')
                .order('fecha_carga', { ascending: false });

            (practicasInd || []).forEach(p => {
                const desc = (p.descripcion_practica || '').toLowerCase();

                // Saltar si es de laboratorio (ya cubierto) o si es una acción
                // interna de facturación (ya cubierta por su propia fuente real)
                if (DESCRIPCIONES_LABORATORIO.some(lab => desc.includes(lab))) return;
                if (DESCRIPCIONES_EXCLUIR_FACTURACION.some(f => desc.includes(f))) return;

                const tipo = mapearTipoPractica(desc);

                estudiosEncontrados.push({
                    TipoEstudio: tipo,
                    DNI: p.dni,
                    Nombre: p.nombre_completo?.split(' ').slice(1).join(' ') || '',
                    Apellido: p.nombre_completo?.split(' ')[0] || '',
                    Fecha: p.fecha_carga ? new Date(p.fecha_carga).toISOString().split('T')[0] : '',
                    Prestador: p.nombre_prestador || '',
                    Resultado: p.resultado_texto || '',
                    LinkPDF: p.enlace_pdf || '',
                    LinksPDF: p.enlace_pdf ? [p.enlace_pdf] : []
                });
            });

            res.json({ success: true, estudios: estudiosEncontrados });

        } catch (e) {
            console.error('Error en /obtener-estudios-paciente:', e.message);
            res.status(500).json({ error: 'Error al obtener estudios.' });
        }
    });
}

function mapearTipoPractica(desc) {
    if (desc.includes('mamog')) return 'Mamografia';
    if (desc.includes('eco') && desc.includes('mam')) return 'Eco mamaria';
    if (desc.includes('ecograf')) return 'Ecografia';
    if (desc.includes('densito')) return 'Densitometria';
    if (desc.includes('colon') || desc.includes('vcc')) return 'VCC';
    if (desc.includes('pap')) return 'Papanicolau';
    if (desc.includes('espiro')) return 'Espirometria';
    if (desc.includes('biopsia')) return 'Biopsia';
    if (desc.includes('oftalm') || desc.includes('visual') || desc.includes('vision')) return 'Oftalmologia';
    if (desc.includes('odonto')) return 'Odontologia';
    return 'Otro';
}

module.exports = { registrarEndpointObtenerEstudios };