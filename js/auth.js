// /js/auth.js

/**
 * Módulo de autenticación para gestionar el acceso de usuarios (operadores y admins).
 */
const Auth = {
    /**
     * Intenta iniciar sesión para un operador de caja.
     * @param {string} cajaId - El ID de la caja seleccionada.
     * @param {string} password - La contraseña ingresada.
     */
    loginCaja: (cajaId, password) => {
        // Primero, verifica si ya hay una sesión de caja activa para evitar sobrescribirla.
        const activeState = Storage.getCurrentCajaState();
        if (activeState) {
            if (confirm('Ya hay una sesión de caja activa con movimientos. ¿Desea cerrar esa sesión y comenzar una nueva? Se perderán los datos no guardados.')) {
                Storage.clearCurrentCajaState();
            } else {
                return; // El usuario canceló, no se hace nada.
            }
        }

        const cajas = Storage.getCajas();
        const caja = cajas.find(c => c.id === cajaId);
        if (caja && caja.password === password) {
            Storage.setCurrentUser({ type: 'caja', id: caja.id, nombre: caja.nombre });
            // Inicia la sesión de caja con la base pre-configurada
            const state = { base: caja.base || 0, movimientos: [] };
            Storage.saveCurrentCajaState(state);
            App.initCajaView();
        } else {
            alert('Contraseña de caja incorrecta.');
        }
    },

    /**
     * Intenta iniciar sesión para un administrador.
     * @param {string} username - El nombre de usuario del admin.
     * @param {string} password - La contraseña del admin.
     * @returns {boolean} - True si el login es exitoso, false en caso contrario.
     */
    loginAdmin: (username, password) => {
        const admins = Storage.getAdmins();
        const admin = admins.find(a => a.username === username);
        if (admin && admin.password === password) {
            Storage.setCurrentUser({ type: 'admin', id: admin.id, username: admin.username });
            return true;
        }
        alert('Usuario o contraseña de administrador incorrectos.');
        return false;
    },

    /**
     * Cierra la sesión del usuario actual, limpiando los datos de sesión.
     */
    logout: () => {
        Storage.clearCurrentUser();
        Storage.clearCurrentCajaState();
        window.location.reload();
    },

    /**
     * Verifica si hay una sesión activa al cargar la aplicación.
     * Redirige a la vista correspondiente si existe una sesión.
     */
    check: () => {
        const user = Storage.getCurrentUser();
        if (user) {
            if (user.type === 'caja') {
                const currentState = Storage.getCurrentCajaState();
                if (currentState && typeof currentState.base !== 'undefined') {
                    App.initCajaView();
                } else {
                    Auth.logout();
                }
            } else if (user.type === 'admin') {
                App.initAdminView();
            }
        } else {
            App.initLoginView();
        }
    }
};
