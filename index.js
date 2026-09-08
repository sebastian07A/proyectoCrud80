//importacion del paquete de express, sistema moderno (import)
import miExpress from "express"
import "dotenv/config"

//importacion de fs y path (sistema moderno)
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

//en ES Modules no existe __dirname por defecto, se reconstruye asi:
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

//creacion de mi aplicacion de express
const miApp = miExpress()
const miPuerto = process.env.MIPUERTO || 3333

//middleware para poder leer JSON en el body de las peticiones (necesario para POST y PUT)
miApp.use(miExpress.json())

//ruta del archivo donde estan guardados los productos
const RUTA_DATOS = path.join(__dirname, "datosProductos.json")

//funcion para leer los productos del archivo json
const leerProductos = () => {
    const data = fs.readFileSync(RUTA_DATOS, "utf-8")
    return JSON.parse(data)
}

//funcion para guardar los productos en el archivo json
const guardarProductos = (productos) => {
    fs.writeFileSync(RUTA_DATOS, JSON.stringify(productos, null, 2), "utf-8")
}

//funcion para generar un nuevo id autoincremental
const generarNuevoId = (productos) => {
    if (productos.length === 0) return 1
    return Math.max(...productos.map((p) => p.id)) + 1
}

//funcion para validar los campos obligatorios de un producto
const validarProducto = (body) => {
    const { nombre, precio, stock, categoria } = body

    if (
        nombre === undefined || nombre === null || nombre === "" ||
        precio === undefined || precio === null || precio === "" ||
        stock === undefined || stock === null || stock === "" ||
        categoria === undefined || categoria === null || categoria === ""
    ) {
        return false
    }
    return true
}

//endpoint raiz, no tiene ruta
miApp.get("/", (req, res) => {
    res.send(`<h1>Api Rest Productos la 80</h1>`)
})

// 2. GET /api/productos -> Listar todos los productos
miApp.get("/api/productos", (req, res) => {
    const productos = leerProductos()
    res.status(200).json(productos)
})

// 3. GET /api/productos/:id -> Obtener un producto por su ID
miApp.get("/api/productos/:id", (req, res) => {
    const productos = leerProductos()
    const id = parseInt(req.params.id)
    const producto = productos.find((p) => p.id === id)

    if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
    }

    res.status(200).json(producto)
})

// 4-7. POST /api/productos -> Crear un producto con validaciones
miApp.post("/api/productos", (req, res) => {
    if (!validarProducto(req.body)) {
        return res.status(400).json({
            mensaje: "Datos inválidos. nombre, precio, stock y categoria son obligatorios."
        })
    }

    const productos = leerProductos()
    const { nombre, precio, stock, categoria, imagen } = req.body

    const nuevoProducto = {
        id: generarNuevoId(productos),
        nombre,
        precio,
        stock,
        categoria,
        imagen: imagen ?? null // Se asigna null temporalmente si no llega imagen
    }

    productos.push(nuevoProducto)
    guardarProductos(productos)

    res.status(201).json(nuevoProducto)
})

// 8. PUT /api/productos/:id -> Actualizar producto (misma validacion). 404 si no existe
miApp.put("/api/productos/:id", (req, res) => {
    const productos = leerProductos()
    const id = parseInt(req.params.id)
    const index = productos.findIndex((p) => p.id === id)

    if (index === -1) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
    }

    if (!validarProducto(req.body)) {
        return res.status(400).json({
            mensaje: "Datos inválidos. nombre, precio, stock y categoria son obligatorios."
        })
    }

    const { nombre, precio, stock, categoria, imagen } = req.body

    productos[index] = {
        ...productos[index],
        nombre,
        precio,
        stock,
        categoria,
        imagen: imagen ?? productos[index].imagen ?? null
    }

    guardarProductos(productos)
    res.status(200).json(productos[index])
})

// 9. DELETE /api/productos/:id -> Eliminar producto por ID
miApp.delete("/api/productos/:id", (req, res) => {
    const productos = leerProductos()
    const id = parseInt(req.params.id)
    const index = productos.findIndex((p) => p.id === id)

    if (index === -1) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
    }

    const productoEliminado = productos.splice(index, 1)[0]
    guardarProductos(productos)

    res.status(200).json({
        mensaje: "Producto eliminado correctamente",
        producto: productoEliminado
    })
})

//link del servidor, por donde se escucha las peticiones del usuario.
miApp.listen(miPuerto, () => {
    console.log(`SERVIDOR: http://localhost:${miPuerto}`)
})