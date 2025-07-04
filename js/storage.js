// Inicialización de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAsEFBd8_MdsTh9o-3gJTFdZFFrN08Cbug",
  authDomain: "herdu-caja.firebaseapp.com",
  databaseURL: "https://herdu-caja-default-rtdb.firebaseio.com",
  projectId: "herdu-caja",
  storageBucket: "herdu-caja.firebasestorage.app",
  messagingSenderId: "500478463392",
  appId: "1:500478463392:web:00bd4a11e6880c42fbe8c5"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const Storage = {
  // Guarda un nuevo movimiento en Firebase
  async saveMovimiento(movimiento) {
    const newKey = database.ref().child('movimientos').push().key;
    movimiento.id = newKey;
    await database.ref('movimientos/' + newKey).set(movimiento);
    return movimiento;
  },

  // Obtiene todos los movimientos desde Firebase
  async getMovimientos() {
    const snapshot = await database.ref('movimientos').once('value');
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  // Guarda una nueva caja en Firebase
  async saveCaja(caja) {
    const newKey = caja.id || database.ref().child('cajas').push().key;
    caja.id = newKey;
    await database.ref('cajas/' + newKey).set(caja);
    return caja;
  },

  // Obtiene todas las cajas desde Firebase
  async getCajas() {
    const snapshot = await database.ref('cajas').once('value');
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  // Guarda un nuevo admin en Firebase
  async saveAdmin(admin) {
    const newKey = admin.id || database.ref().child('admins').push().key;
    admin.id = newKey;
    await database.ref('admins/' + newKey).set(admin);
    return admin;
  },

  // Obtiene todos los admins desde Firebase
  async getAdmins() {
    const snapshot = await database.ref('admins').once('value');
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  // Guarda un nuevo método de pago en Firebase
  async saveMetodoPago(metodo) {
    const newKey = metodo.id || database.ref().child('metodosPago').push().key;
    metodo.id = newKey;
    await database.ref('metodosPago/' + newKey).set(metodo);
    return metodo;
  },

  // Obtiene todos los métodos de pago desde Firebase
  async getMetodosPago() {
    const snapshot = await database.ref('metodosPago').once('value');
    const data = snapshot.val();
    return data ? Object.values(data) : [];
  },

  // Guarda el usuario actual en sesión (puedes adaptar según tu lógica)
  setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  },

  // Obtiene el usuario actual en sesión
  getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  // Limpia el usuario actual en sesión
  clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
  },

  // Aquí puedes agregar más métodos adaptados a Firebase según necesites
};

export default Storage;
