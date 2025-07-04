/**
 * Módulo para controlar y manipular la interfaz de usuario (DOM).
 * Centraliza todas las interacciones con el DOM para mantener la lógica separada.
 */
const UI = {
    // Selectores de elementos para acceso rápido
    views: document.querySelectorAll('.view'),
    cajaSelect: document.getElementById('caja-select'),
    cajaViewTitle: document.getElementById('caja-view-title'),
    cajaViewDate: document.getElementById('caja-view-date'),
    resumenDiarioContainer: document.getElementById('resumen-diario'),
    
    // Contenedores para las nuevas listas de movimientos
    transferenciasList: document.getElementById('transferencias-list'),
    gastosList: document.getElementById('gastos-list'),
    avancesRecogidasList: document.getElementById('avances-recogidas-list'),
    
    showView: (viewId) => {
        UI.views.forEach(view => {
            view.classList.remove('active-view');
            if (view.id === viewId) {
                view.classList.add('active-view');
            }
        });
    },

    toggleModal: (modalId, show) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = show ? 'block' : 'none';
        }
    },

    populateCajaSelect: () => {
        const cajas = Storage.getCajas();
        UI.cajaSelect.innerHTML = '<option value="" disabled selected>-- Seleccione una caja --</option>';
        cajas.forEach(caja => {
            const option = document.createElement('option');
            option.value = caja.id;
            option.textContent = caja.nombre;
            UI.cajaSelect.appendChild(option);
        });
    },
    
    populateMetodosPagoSelects: () => {
        const metodos = Storage.getMetodosPago();
        const selects = document.querySelectorAll('.metodo-pago-select');
        selects.forEach(select => {
            select.innerHTML = '<option value="" disabled selected>-- Elija un método --</option>';
            metodos.forEach(metodo => {
                const option = document.createElement('option');
                option.value = metodo.nombre;
                option.textContent = metodo.nombre;
                select.appendChild(option);
            });
        });
    },
    
    renderMetodosPagoList: () => {
        const metodos = Storage.getMetodosPago();
        const container = document.getElementById('metodos-pago-list-container');
        if (!metodos || metodos.length === 0) {
            container.innerHTML = '<p>No hay métodos de pago registrados.</p>';
            return;
        }
        container.innerHTML = metodos.map(metodo => `
            <div class="item-card" data-id="${metodo.id}">
                <span>${metodo.nombre}</span>
                <div class="item-actions">
                    <button class="btn btn-danger btn-sm eliminar-metodo" data-id="${metodo.id}">Eliminar</button>
                </div>
            </div>
        `).join('');
    },
    
    setupCajaHeader: (nombreCaja) => {
        UI.cajaViewTitle.textContent = `Caja: ${nombreCaja}`;
        UI.cajaViewDate.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    },

    updateMovimientosLists: () => {
        const state = Storage.getCurrentCajaState();
        if (!state) return;
        
        const filterAndRender = (type, container) => {
            if (!container) return;
            if (type === 'transferencia') {
                // Unir transferencias con su domicilio relacionado
                const transferencias = state.movimientos.filter(m => m.type === 'transferencia');
                const domicilios = state.movimientos.filter(m => m.type === 'domicilio');
                const items = transferencias.map(transfer => {
                    // Busca el domicilio relacionado por método de pago y cercanía de tiempo (ajusta si tienes mejor lógica)
                    const domicilio = domicilios.find(d => 
                        d.descripcion.includes(transfer.descripcion) &&
                        Math.abs(Number(d.id.split('-')[1]) - Number(transfer.id.split('-')[1])) < 60000 // 1 min de diferencia
                    );
                    return Components.movimientoItem({
                        ...transfer,
                        domicilio: domicilio ? domicilio.monto : null
                    });
                });
                container.innerHTML = items.length === 0
                    ? `<p style="text-align: center; color: #999; font-size: 0.9em;">Sin registros</p>`
                    : items.reverse().join('');
            } else {
                const movimientosFiltrados = state.movimientos.filter(m => m.type === type);
                container.innerHTML = movimientosFiltrados.length === 0
                    ? `<p style="text-align: center; color: #999; font-size: 0.9em;">Sin registros</p>`
                    : movimientosFiltrados.slice().reverse().map(Components.movimientoItem).join('');
            }
        };

        filterAndRender('transferencia', UI.transferenciasList);
        filterAndRender('gasto', UI.gastosList);
        filterAndRender('avance_recogida', UI.avancesRecogidasList);
    },

    updateCajaSummary: () => {
        const state = Storage.getCurrentCajaState();
        if(state) {
            UI.resumenDiarioContainer.innerHTML = Components.cajaSummary(state);
        }
    },

    renderManagementList: (type) => {
        const items = type === 'caja' ? Storage.getCajas() : Storage.getAdmins();
        const containerId = type === 'caja' ? 'cajas-list-container' : 'admins-list-container';
        const container = document.getElementById(containerId);
        
        if (!items || items.length === 0) {
            container.innerHTML = `<p>No hay ${type}s registrados.</p>`;
            return;
        }
        container.innerHTML = items.map(item => Components.managementItem(item, type)).join('');
    },
    
    populateAdminCajaFilter: () => {
        const filtroCajaDetallado = document.getElementById('filtro-caja-detallado');
        if (!filtroCajaDetallado) return;

        const cajas = Storage.getCajas();
        
        filtroCajaDetallado.innerHTML = '<option value="">Seleccione una Caja</option>';

        cajas.forEach(caja => {
            const option = document.createElement('option');
            option.value = caja.id;
            option.textContent = caja.nombre;
            filtroCajaDetallado.appendChild(option);
        });
    },

    // NUEVO: Formato de pesos en campos de dinero
    setupMoneyInputs: () => {
        const moneyInputs = document.querySelectorAll('input[type="number"], input.money-format');
        moneyInputs.forEach(input => {
            input.type = "text";
            input.classList.add("money-format");
            input.addEventListener('input', UI.moneyInputHandler);
            input.addEventListener('blur', UI.moneyInputHandler);
        });
    },

    moneyInputHandler: (e) => {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value === '') {
            e.target.value = '';
            return;
        }
        value = parseInt(value, 10).toLocaleString('es-CO');
        e.target.value = '$' + value;
    },

    // Convierte el valor de un input de dinero a número
    parseMoney: (value) => {
        if (!value) return 0;
        return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    }
};