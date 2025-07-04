// /js/storage.js

/**
 * Módulo para interactuar con el LocalStorage y SessionStorage del navegador.
 * Abstrae las operaciones de lectura y escritura para el resto de la aplicación,
 * asegurando consistencia y manejo de errores básicos.
 */
const Storage = {
    /**
     * Obtiene un item de una fuente de almacenamiento y lo parsea como JSON.
     * @param {string} key - La clave del item a obtener.
     * @param {'local' | 'session'} from - El almacenamiento a usar ('local' por defecto).
     * @param {any} defaultValue - El valor a retornar si no se encuentra nada.
     * @returns {any} El valor parseado o el valor por defecto si no existe o hay error.
     */
    get: (key, from = 'local', defaultValue = []) => {
        const storage = from === 'local' ? localStorage : sessionStorage;
        try {
            const data = storage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error al leer '${key}' de ${from}Storage:`, error);
            return defaultValue;
        }
    },

    /**
     * Guarda un item en el almacenamiento, convirtiéndolo a string JSON.
     * @param {string} key - La clave bajo la cual se guardará el item.
     * @param {any} value - El valor a guardar.
     * @param {'local' | 'session'} to - El almacenamiento a usar ('local' por defecto).
     */
    set: (key, value, to = 'local') => {
        const storage = to === 'local' ? localStorage : sessionStorage;
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch (error)
        {
            console.error(`Error al guardar '${key}' en ${to}Storage:`, error);
        }
    },
    
    // --- Métodos Específicos para Datos Persistentes (LocalStorage) ---

    getAdmins: () => Storage.get('admins'),
    saveAdmins: (admins) => Storage.set('admins', admins),

    getCajas: () => Storage.get('cajas'),
    saveCajas: (cajas) => Storage.set('cajas', cajas),

    getReportes: () => Storage.get('reportes'),
    saveReportes: (reportes) => Storage.set('reportes', reportes),
    
    getMetodosPago: () => Storage.get('metodosPago'),
    saveMetodosPago: (metodos) => Storage.set('metodosPago', metodos),

    // --- Métodos Específicos para Datos de Sesión (SessionStorage) ---

    /**
     * Obtiene el estado actual de la caja.
     * AHORA CONTIENE BASE Y UN ÚNICO ARRAY DE MOVIMIENTOS.
     * @returns {{base: number, movimientos: Array<object>}} El estado actual de la caja.
     */
    getCurrentCajaState: () => {
        return Storage.get('currentCajaState', 'session', null);
    },

    saveCurrentCajaState: (state) => Storage.set('currentCajaState', state, 'session'),
    clearCurrentCajaState: () => sessionStorage.removeItem('currentCajaState'),

    getCurrentUser: () => {
        return Storage.get('currentUser', 'session', null);
    },
    setCurrentUser: (user) => Storage.set('currentUser', user, 'session'),
    clearCurrentUser: () => sessionStorage.removeItem('currentUser')
};
