/**
 * Módulo que contiene funciones que generan plantillas HTML dinámicas.
 */
const Components = {

    formatCurrency: (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount),

    // FUNCIÓN CORREGIDA: cada dato en <span> para alineación horizontal
    movimientoItem: (movimiento) => {
        const { id, type, monto, descripcion, estado, observacion, domicilio } = movimiento;
        let montoColor = monto >= 0 ? 'color: var(--success-color);' : 'color: var(--danger-color);';
        if (type === 'transferencia') montoColor = 'color: var(--secondary-color);';

        // Si es transferencia y tiene domicilio, mostrar ambos en una sola línea
        if (type === 'transferencia' && domicilio) {
            return `
            <div class="movimiento-item ${estado === 'anulado' ? 'anulado' : ''}" data-id="${id}">
                <span class="movimiento-tipo">${type || ''}</span>
                <span class="movimiento-destino">${descripcion || ''}</span>
                <span class="movimiento-monto" style="${montoColor}">
                    ${Components.formatCurrency(monto)} - Domicilio ${Components.formatCurrency(domicilio)}
                </span>
                ${observacion ? `<span class="movimiento-obs">${observacion}</span>` : ''}
                <div class="movimiento-actions">
                    ${estado !== 'anulado' ? `<button class="btn-anular" data-id="${id}" title="Anular Movimiento"><i class="fas fa-times-circle"></i></button>` : ''}
                </div>
            </div>
            `;
        }

        // Para los demás tipos, igual que antes
        return `
        <div class="movimiento-item ${estado === 'anulado' ? 'anulado' : ''}" data-id="${id}">
            <span class="movimiento-tipo">${type || ''}</span>
            <span class="movimiento-destino">${descripcion || ''}</span>
            <span class="movimiento-monto" style="${montoColor}">${Components.formatCurrency(monto)}</span>
            ${observacion ? `<span class="movimiento-obs">${observacion}</span>` : ''}
            <div class="movimiento-actions">
                ${estado !== 'anulado' ? `<button class="btn-anular" data-id="${id}" title="Anular Movimiento"><i class="fas fa-times-circle"></i></button>` : ''}
            </div>
        </div>
        `;
    },

    cajaSummary: (state) => {
        const movimientosActivos = state.movimientos.filter(m => m.estado !== 'anulado');
        const base = state.base || 0;

        const totalTransferencias = movimientosActivos.filter(m => m.type === 'transferencia').reduce((sum, t) => sum + t.monto, 0);
        const totalDomicilios = movimientosActivos.filter(m => m.type === 'domicilio').reduce((sum, p) => sum + p.monto, 0);
        const totalGastos = movimientosActivos.filter(m => m.type === 'gasto').reduce((sum, g) => sum + g.monto, 0);
        const totalAvancesRecogidas = movimientosActivos.filter(m => m.type === 'avance_recogida').reduce((sum, a) => sum + a.monto, 0);

        const efectivoEnCaja = base + totalAvancesRecogidas - totalGastos - totalDomicilios;
        
        return `
        <div class="resumen-item"><span>Base Inicial:</span> <span>${Components.formatCurrency(base)}</span></div>
        <div class="resumen-item"><span>Total Transferencias:</span> <span>${Components.formatCurrency(totalTransferencias)}</span></div>
        <div class="resumen-item"><span>(+) Avances / (-) Recogidas:</span> <span>${Components.formatCurrency(totalAvancesRecogidas)}</span></div>
        <div class="resumen-item"><span>(-) Gastos:</span> <span>${Components.formatCurrency(totalGastos)}</span></div>
        <div class="resumen-item"><span>(-) Domicilios:</span> <span>${Components.formatCurrency(totalDomicilios)}</span></div>
        <hr>
        <div class="resumen-item total-final">
        <span>Efectivo en Caja (sin ventas):</span>
        <span>${Components.formatCurrency(efectivoEnCaja)}</span>
        </div>
        `;
    },
    
    calcularTotalesReporte: (state, ventasEfectivo) => {
        const movimientosActivos = state.movimientos.filter(m => m.estado !== 'anulado');
        const base = state.base || 0;

        const totalTransferencias = movimientosActivos.filter(m => m.type === 'transferencia').reduce((s, m) => s + m.monto, 0);
        const totalGastos = movimientosActivos.filter(m => m.type === 'gasto').reduce((s, m) => s + m.monto, 0);
        const totalDomicilios = movimientosActivos.filter(m => m.type === 'domicilio').reduce((s, m) => s + m.monto, 0);
        const totalAvancesRecogidas = movimientosActivos.filter(m => m.type === 'avance_recogida').reduce((s, m) => s + m.monto, 0);
        
        const totalEnCaja = base + ventasEfectivo + totalAvancesRecogidas - totalGastos - totalDomicilios;
        const dineroAEntregar = totalEnCaja - base;

        return { base, ventasEfectivo, totalTransferencias, totalGastos, totalDomicilios, totalAvancesRecogidas, totalEnCaja, dineroAEntregar };
    },

    reporteCuadre: (datos) => {
        const { base, ventasEfectivo, totalGastos, totalDomicilios, totalAvancesRecogidas, totalEnCaja, dineroAEntregar } = datos;
        
        return `
        <div class="reporte-cuadre-linea"><span>Ventas en Efectivo (Software)</span><strong>${Components.formatCurrency(ventasEfectivo)}</strong></div>
        <div class="reporte-cuadre-linea"><span>(+) Base de Caja</span><strong>${Components.formatCurrency(base)}</strong></div>
        <div class="reporte-cuadre-linea"><span>(+) Avances / (-) Recogidas</span><strong>${Components.formatCurrency(totalAvancesRecogidas)}</strong></div>
        <div class="reporte-cuadre-linea"><span>(-) Gastos Pagados</span><strong>-${Components.formatCurrency(totalGastos)}</strong></div>
        <div class="reporte-cuadre-linea"><span>(-) Domicilios Pagados</span><strong>-${Components.formatCurrency(totalDomicilios)}</strong></div>
        <div class="reporte-cuadre-linea reporte-cuadre-total"><span>= TOTAL EFECTIVO EN CAJA</span><strong>${Components.formatCurrency(totalEnCaja)}</strong></div>
        <div class="reporte-cuadre-linea"><span>(-) Se deja Base para mañana</span><strong>-${Components.formatCurrency(base)}</strong></div>
        <div class="reporte-cuadre-linea reporte-cuadre-total" style="background-color: var(--success-color); color: white;"><span>= DINERO A ENTREGAR</span><strong>${Components.formatCurrency(dineroAEntregar)}</strong></div>
        `;
    },
    
    reporteDetalladoAdmin: (reporte) => {
        const caja = Storage.getCajas().find(c => c.id === reporte.cajaId);
        const { base, ventasEfectivoContable, movimientos } = reporte;
        const totales = Components.calcularTotalesReporte({movimientos, base}, ventasEfectivoContable);

        const renderMovimientos = (tipo, titulo) => {
            const movsFiltrados = movimientos.filter(m => m.type === tipo || (tipo === 'transferencia' && m.type === 'domicilio'));
            if (movsFiltrados.length === 0) return '';
            return `
            <h4>${titulo}</h4>
            <ul>
            ${movsFiltrados.map(mov => `
                <li class="${mov.estado === 'anulado' ? 'anulado' : ''}">
                    <i class="fas fa-circle" style="font-size:0.5em"></i> 
                    <span class="anulado-main">
                        ${mov.descripcion}: ${Components.formatCurrency(mov.monto)}
                        ${mov.estado === 'anulado' ? ' (Anulado)' : ''}
                    </span>
                    ${mov.estado === 'anulado' && mov.justificacionAnulacion ? 
                        `<span class="anulado-motivo"> — ${mov.justificacionAnulacion}</span>` : ''}
                </li>
            `).join('')}
            </ul>
            `;
        };

        return `
        <h3>Reporte del ${new Date(reporte.fecha).toLocaleDateString('es-ES')} - Caja: ${caja.nombre}</h3>
        <div class="reporte-detallado-grid">
        <div class="reporte-detallado-movimientos">
        ${renderMovimientos('transferencia', 'Transferencias y Domicilios')}
        ${renderMovimientos('gasto', 'Gastos (Efectivo)')}
        ${renderMovimientos('avance_recogida', 'Avances y Recogidas (Efectivo)')}
        </div>
        <div class="reporte-detallado-summary">
        <h4>Resumen del Día</h4>
        ${Components.reporteCuadre(totales)}
        </div>
        </div>
        `;
    },

    managementItem: (item, type) => {
        const name = type === 'caja' ? item.nombre : item.username;
        const baseInfo = type === 'caja' ? `<span class="item-subtext">Base: ${Components.formatCurrency(item.base || 0)}</span>` : '';
        return `
        <div class="item-card" data-id="${item.id}">
            <div>
                <span><i class="fas ${type === 'caja' ? 'fa-inbox' : 'fa-user'}"></i> ${name}</span>
                ${baseInfo}
            </div>
            <div class="item-actions">
                <button class="btn btn-sm editar-${type}" data-id="${item.id}">Editar</button>
                <button class="btn btn-danger btn-sm eliminar-${type}" data-id="${item.id}">Eliminar</button>
            </div>
        </div>
        `;
    }
};