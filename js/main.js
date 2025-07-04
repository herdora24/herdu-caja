/**
 * Lógica principal de la aplicación.
 */
const App = {
    tempReporteData: null,
    cajaEventsBound: false,
    adminEventsBound: false,
    
    init: () => {
        App.ensureInitialData();
        App.bindInitialEvents();
        Auth.check();
    },

    ensureInitialData: () => {
        if (Storage.getAdmins().length === 0) {
            Storage.saveAdmins([{ id: `admin-${Date.now()}`, username: 'admin', password: 'admin' }]);
            alert('Usuario administrador por defecto creado.\nUsuario: admin\nContraseña: admin');
        }
        if (Storage.getMetodosPago().length === 0) {
            Storage.saveMetodosPago([
                { id: `metodo-${Date.now()+1}`, nombre: 'Nequi' },
                { id: `metodo-${Date.now()+2}`, nombre: 'Daviplata' },
                { id: `metodo-${Date.now()+3}`, nombre: 'Bancolombia' },
            ]);
        }
    },

    bindInitialEvents: () => {
        document.getElementById('login-form').addEventListener('submit', App.handleCajaLogin);
        document.getElementById('show-admin-login').addEventListener('click', (e) => { e.preventDefault(); UI.toggleModal('admin-login-modal', true); });
        document.getElementById('admin-login-form').addEventListener('submit', App.handleAdminLogin);
        
        document.querySelectorAll('.modal .close-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal').id;
                UI.toggleModal(modalId, false);
            });
        });
    },

    bindCajaEvents: () => {
        if (App.cajaEventsBound) return;

        document.getElementById('logout-btn').addEventListener('click', Auth.logout);
        document.getElementById('add-transferencia-form').addEventListener('submit', App.handleAddTransferencia);
        document.getElementById('add-gasto-form').addEventListener('submit', App.handleAddGasto);
        document.getElementById('add-avance-recogida-form').addEventListener('submit', App.handleAddAvanceRecogida);
        document.getElementById('generar-reporte-form').addEventListener('submit', App.handleGenerarReporte);
        
        document.getElementById('transferencias-list').addEventListener('click', App.handleMovimientoActions);
        document.getElementById('gastos-list').addEventListener('click', App.handleMovimientoActions);
        document.getElementById('avances-recogidas-list').addEventListener('click', App.handleMovimientoActions);
        document.getElementById('anulacion-form').addEventListener('submit', App.handleAnulacionSubmit);

        document.getElementById('manage-metodos-btn').addEventListener('click', App.handleManageMetodos);
        document.getElementById('form-metodo-pago').addEventListener('submit', App.handleSaveMetodo);
        document.getElementById('metodos-pago-list-container').addEventListener('click', App.handleMetodoListActions);
        
        document.getElementById('cerrar-caja-definitivo-btn').addEventListener('click', App.handleCerrarCajaDefinitivo);
        document.getElementById('imprimir-reporte-btn').addEventListener('click', App.handleImprimirReporte);

        // Formato de pesos en campos de dinero
        UI.setupMoneyInputs();

        App.cajaEventsBound = true;
    },

    bindAdminEvents: () => {
        if (App.adminEventsBound) return;

        document.getElementById('admin-logout-btn').addEventListener('click', Auth.logout);
        document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => btn.addEventListener('click', App.handleAdminNav));
        
        document.getElementById('form-caja').addEventListener('submit', App.handleSaveCaja);
        document.getElementById('cajas-list-container').addEventListener('click', App.handleCajaListActions);
        document.getElementById('form-admin').addEventListener('submit', App.handleSaveAdmin);
        document.getElementById('admins-list-container').addEventListener('click', App.handleAdminListActions);
        
        document.getElementById('buscar-reporte-detallado-btn').addEventListener('click', App.handleBuscarReporteDetallado);
        document.getElementById('borrar-historial-mes-btn').addEventListener('click', App.handleBorrarHistorialMes);

        App.adminEventsBound = true;
    },

    initLoginView: () => {
        UI.populateCajaSelect();
        UI.showView('login-view');
    },

    // MODIFICADO: Solo permite trabajar una vez por día en cada caja
    initCajaView: () => {
        const user = Storage.getCurrentUser();
        const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const reportes = Storage.getReportes();
        const yaCerrada = reportes.some(r => r.cajaId === user.id && r.fecha === hoy);

        if (yaCerrada) {
            alert('Esta caja ya fue cerrada hoy. No se pueden registrar más movimientos hasta mañana.');
            Auth.logout();
            return;
        }

        UI.setupCajaHeader(user.nombre);
        UI.populateMetodosPagoSelects();
        UI.updateMovimientosLists();
        UI.updateCajaSummary();
        App.bindCajaEvents();
        UI.showView('caja-view');
    },

    initAdminView: () => {
        UI.populateAdminCajaFilter();
        UI.renderManagementList('caja');
        UI.renderManagementList('admin');
        App.bindAdminEvents();
        UI.showView('admin-view');
    },
    
    handleCajaLogin: (e) => {
        e.preventDefault();
        Auth.loginCaja(
            document.getElementById('caja-select').value,
            document.getElementById('password-input').value
        );
        e.target.reset();
    },

    handleAdminLogin: (e) => {
        e.preventDefault();
        if (Auth.loginAdmin(document.getElementById('admin-username').value, document.getElementById('admin-password').value)) {
            UI.toggleModal('admin-login-modal', false);
            App.initAdminView();
        }
        e.target.reset();
    },
    
    _addMovimiento: (movimientoData) => {
        const state = Storage.getCurrentCajaState();
        state.movimientos.push({ id: `mov-${Date.now()}`, ...movimientoData, estado: 'activo', justificacionAnulacion: null });
        Storage.saveCurrentCajaState(state);
        UI.updateMovimientosLists();
        UI.updateCajaSummary();
    },

    handleAddTransferencia: (e) => {
        e.preventDefault();
        const form = e.target;
        const metodo = form.querySelector('#transferencia-metodo').value;
        const monto = UI.parseMoney(form.querySelector('#transferencia-monto').value);
        const domicilio = UI.parseMoney(form.querySelector('#transferencia-domicilio').value) || 0;

        if (!metodo || isNaN(monto) || monto <= 0) {
            alert('Debe seleccionar un método e ingresar un monto válido.');
            return;
        }
        App._addMovimiento({ type: 'transferencia', descripcion: metodo, monto });
        if (domicilio > 0) {
            App._addMovimiento({ type: 'domicilio', descripcion: `Domicilio (${metodo})`, monto: domicilio });
        }
        form.reset();
    },

    handleAddGasto: (e) => {
        e.preventDefault();
        const form = e.target;
        const desc = form.querySelector('#gasto-desc').value;
        const monto = UI.parseMoney(form.querySelector('#gasto-monto').value);
        if (desc.trim() && monto > 0) {
            App._addMovimiento({ type: 'gasto', descripcion: desc, monto });
            form.reset();
        } else {
            alert('Debe ingresar una descripción y un monto válido.');
        }
    },
    
    handleAddAvanceRecogida: (e) => {
        e.preventDefault();
        const form = e.target;
        const desc = form.querySelector('#avance-recogida-desc').value;
        let monto = UI.parseMoney(form.querySelector('#avance-recogida-monto').value);
        
        if (desc.trim() && !isNaN(monto) && monto !== 0) {
            if (desc.toLowerCase().includes('recogida') || desc.toLowerCase().includes('retiro')) {
                monto = -Math.abs(monto);
            }
            App._addMovimiento({ type: 'avance_recogida', descripcion: desc, monto });
            form.reset();
        } else {
            alert('Debe ingresar una descripción y un monto diferente de cero.');
        }
    },

    handleMovimientoActions: (e) => {
        const target = e.target.closest('.btn-anular');
        if (target) {
            document.getElementById('anulacion-id').value = target.dataset.id;
            UI.toggleModal('anulacion-modal', true);
        }
    },

    // MODIFICADO: Anula transferencia y domicilio relacionado juntos
    handleAnulacionSubmit: (e) => {
        e.preventDefault();
        const id = document.getElementById('anulacion-id').value;
        const justificacion = document.getElementById('anulacion-justificacion').value;
        
        if (!justificacion.trim()) {
            alert('La justificación es obligatoria.');
            return;
        }
        const state = Storage.getCurrentCajaState();
        const movimiento = state.movimientos.find(m => m.id === id);
        if (movimiento) {
            movimiento.estado = 'anulado';
            movimiento.justificacionAnulacion = justificacion;

            // Si es transferencia, anular también el domicilio relacionado
            if (movimiento.type === 'transferencia') {
                const idx = state.movimientos.findIndex(m => m.id === id);
                if (idx !== -1) {
                    const metodo = movimiento.descripcion;
                    for (let i = idx + 1; i < state.movimientos.length; i++) {
                        const mov = state.movimientos[i];
                        if (
                            mov.type === 'domicilio' &&
                            mov.descripcion &&
                            mov.descripcion.includes(metodo) &&
                            mov.estado !== 'anulado'
                        ) {
                            mov.estado = 'anulado';
                            mov.justificacionAnulacion = justificacion;
                            break; // Solo anula el primer domicilio relacionado
                        }
                    }
                }
            }
            Storage.saveCurrentCajaState(state);
            UI.updateMovimientosLists();
            UI.updateCajaSummary();
        }
        UI.toggleModal('anulacion-modal', false);
        e.target.reset();
    },

    handleGenerarReporte: (e) => {
        e.preventDefault();
        const ventasEfectivo = UI.parseMoney(document.getElementById('ventas-efectivo-contable').value);
        if (isNaN(ventasEfectivo)) {
            alert('Por favor, ingrese un valor válido para las ventas en efectivo.');
            return;
        }
        const state = Storage.getCurrentCajaState();
        App.tempReporteData = Components.calcularTotalesReporte(state, ventasEfectivo);

        // LIMPIA el contenedor antes de poner el ticket
        const reporteContainer = document.getElementById('reporte-cuadre-container');
        reporteContainer.innerHTML = '';
        reporteContainer.innerHTML = Components.reporteCuadre(App.tempReporteData);

        UI.toggleModal('reporte-cuadre-modal', true);
    },
    
    handleCerrarCajaDefinitivo: () => {
        if (!App.tempReporteData) return;
        const state = Storage.getCurrentCajaState();
        const user = Storage.getCurrentUser();

        // Guardar la fecha local de Colombia (GMT-5)
        const fechaColombia = new Date();
        const offsetMs = fechaColombia.getTimezoneOffset() * 60000;
        const colombiaMs = fechaColombia.getTime() - offsetMs - (5 * 60 * 60 * 1000);
        const fechaLocal = new Date(colombiaMs);

        const nuevoReporte = {
            id: `rep-${Date.now()}`,
            fecha: fechaLocal.toISOString().slice(0, 10), // Solo la fecha YYYY-MM-DD
            cajaId: user.id,
            base: state.base,
            movimientos: state.movimientos,
            ventasEfectivoContable: App.tempReporteData.ventasEfectivo,
        };
        const reportes = Storage.getReportes();
        reportes.push(nuevoReporte);
        Storage.saveReportes(reportes);
        
        App.tempReporteData = null;
        alert('Reporte guardado. La caja se ha cerrado.');
        Auth.logout();
    },

    handleImprimirReporte: () => window.print(),

    handleAdminNav: (e) => {
        const targetId = e.target.closest('button').dataset.target;
        document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
        e.target.closest('button').classList.add('active');
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    },

    handleBuscarReporteDetallado: () => {
        const fecha = document.getElementById('filtro-fecha-detallado').value;
        const cajaId = document.getElementById('filtro-caja-detallado').value;
        if (!fecha || !cajaId) {
            alert('Debe seleccionar una fecha y una caja.');
            return;
        }
        const reportes = Storage.getReportes();
        // Buscar por fecha local (YYYY-MM-DD)
        const reporteEncontrado = reportes.find(r => r.cajaId === cajaId && r.fecha === fecha);
        const container = document.getElementById('reporte-detallado-container');
        container.innerHTML = reporteEncontrado ? Components.reporteDetalladoAdmin(reporteEncontrado) : '<p>No se encontró reporte.</p>';
    },
    
    handleBorrarHistorialMes: () => {
        const mesInput = document.getElementById('mes-a-borrar').value;
        if (!mesInput) {
            alert('Por favor, seleccione un mes para borrar.');
            return;
        }
        if (confirm(`¡ATENCIÓN!\nEstá a punto de borrar TODOS los reportes de ${mesInput}. Esta acción es irreversible. ¿Desea continuar?`)) {
            let reportes = Storage.getReportes();
            const reportesConservados = reportes.filter(r => !r.fecha.startsWith(mesInput));
            Storage.saveReportes(reportesConservados);
            document.getElementById('reporte-detallado-container').innerHTML = '';
            alert(`Se han borrado los reportes del mes ${mesInput}.`);
        }
    },
    
    handleManageMetodos: () => {
        UI.renderMetodosPagoList();
        UI.toggleModal('metodos-pago-modal', true);
    },

    handleSaveMetodo: (e) => {
        e.preventDefault();
        const nombreInput = document.getElementById('metodo-pago-nombre');
        const nombre = nombreInput.value.trim();
        if (nombre) {
            const metodos = Storage.getMetodosPago();
            if (metodos.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())) {
                alert('Ese método de pago ya existe.');
                return;
            }
            metodos.push({ id: `metodo-${Date.now()}`, nombre });
            Storage.saveMetodosPago(metodos);
            UI.renderMetodosPagoList();
            UI.populateMetodosPagoSelects();
            nombreInput.value = '';
        }
    },
    
    handleMetodoListActions: (e) => {
        const target = e.target.closest('.eliminar-metodo');
        if (target) {
            const id = target.dataset.id;
            if (confirm('¿Está seguro?')) {
                let metodos = Storage.getMetodosPago();
                metodos = metodos.filter(m => m.id !== id);
                Storage.saveMetodosPago(metodos);
                UI.renderMetodosPagoList();
                UI.populateMetodosPagoSelects();
            }
        }
    },
    
    handleSaveCaja: (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.querySelector('#caja-id').value;
        const nombre = form.querySelector('#caja-nombre').value;
        const password = form.querySelector('#caja-password').value;
        const base = UI.parseMoney(form.querySelector('#caja-base').value) || 0;

        if (!nombre || !password) {
            alert('Nombre y contraseña son obligatorios.');
            return;
        }

        let cajas = Storage.getCajas();
        if (id) {
            const caja = cajas.find(c => c.id === id);
            if (caja) {
                caja.nombre = nombre;
                caja.password = password;
                caja.base = base;
            }
        } else {
            cajas.push({ id: `caja-${Date.now()}`, nombre, password, base });
        }
        Storage.saveCajas(cajas);
        UI.renderManagementList('caja');
        UI.populateAdminCajaFilter();
        form.reset();
    },
    
    handleCajaListActions: (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;

        if (target.classList.contains('editar-caja')) {
            const cajas = Storage.getCajas();
            const caja = cajas.find(c => c.id === id);
            if (caja) {
                const form = document.getElementById('form-caja');
                form.querySelector('#caja-id').value = caja.id;
                form.querySelector('#caja-nombre').value = caja.nombre;
                form.querySelector('#caja-password').value = caja.password;
                form.querySelector('#caja-base').value = caja.base || 0;
            }
        } else if (target.classList.contains('eliminar-caja')) {
            if (confirm('¿Está seguro?')) {
                let cajas = Storage.getCajas();
                cajas = cajas.filter(c => c.id !== id);
                Storage.saveCajas(cajas);
                UI.renderManagementList('caja');
                UI.populateAdminCajaFilter();
            }
        }
    },

    handleSaveAdmin: (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.querySelector('#admin-id').value;
        const username = form.querySelector('#admin-username-input').value;
        const password = form.querySelector('#admin-password-input').value;
        
        if (!username || !password) {
            alert('Todos los campos son obligatorios.');
            return;
        }
        let admins = Storage.getAdmins();
        if (id) {
            const admin = admins.find(a => a.id === id);
            if (admin) {
                admin.username = username;
                admin.password = password;
            }
        } else {
            admins.push({ id: `admin-${Date.now()}`, username, password });
        }
        Storage.saveAdmins(admins);
        UI.renderManagementList('admin');
        form.reset();
    },

    handleAdminListActions: (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;

        if (target.classList.contains('editar-admin')) {
            const admins = Storage.getAdmins();
            const admin = admins.find(a => a.id === id);
            if (admin) {
                const form = document.getElementById('form-admin');
                form.querySelector('#admin-id').value = admin.id;
                form.querySelector('#admin-username-input').value = admin.username;
                form.querySelector('#admin-password-input').value = admin.password;
            }
        } else if (target.classList.contains('eliminar-admin')) {
            let admins = Storage.getAdmins();
            if (admins.length <= 1) {
                alert('No se puede eliminar el último administrador.');
                return;
            }
            if (confirm('¿Está seguro?')) {
                admins = admins.filter(a => a.id !== id);
                Storage.saveAdmins(admins);
                UI.renderManagementList('admin');
            }
        }
    },
};

document.addEventListener('DOMContentLoaded', App.init);