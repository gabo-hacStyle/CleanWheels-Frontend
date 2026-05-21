import { useState, useEffect } from 'react'
import { uploadImageToCloudinary } from '../../../../services/cloudinaryService'
import ImageUpload from './components/ImageUpload'
import './Servicios.css'

const formularioVacio = { name: "", price: "", description: "", duration: "", is_active: true, category_id: "", url: "" }
const categoriaVacia = { name: "", description: "" }

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [formulario, setFormulario] = useState(formularioVacio)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarModalCat, setMostrarModalCat] = useState(false)
  const [formularioCat, setFormularioCat] = useState(categoriaVacia)
  const [editandoCatId, setEditandoCatId] = useState(null)
  const [error, setError] = useState("")
  const [errorCat, setErrorCat] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)

  const token = localStorage.getItem("token")
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }

  const cargarServicios = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/booking/services/admin", { headers })
      const data = await res.json()
      setServicios(data.data)
    } catch (err) {
      console.error("Error cargando servicios:", err)
    }
  }

  const cargarCategorias = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/booking/categories", { headers })
      const data = await res.json()
      setCategorias(data.data || data)
    } catch (err) {
      console.error("Error cargando categorías:", err)
    }
  }

  useEffect(() => {
    cargarServicios()
    cargarCategorias()
  }, [])

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setFormulario(prev => ({ ...prev, url: imageUrl }));
      setError("");
      return imageUrl;
    } catch (err) {
      setError("Error al subir la imagen: " + err.message);
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormulario(prev => ({ ...prev, url: "" }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormulario(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleChangeCat = (e) => {
    const { name, value } = e.target
    setFormularioCat(prev => ({ ...prev, [name]: value }))
  }

  const handleGuardar = async () => {
    setError("")

    if (!formulario.name || !formulario.price || !formulario.description || !formulario.duration || !formulario.category_id) {
      setError("Todos los campos son obligatorios.")
      return
    }

    if (formulario.name.length > 150) {
      setError("El nombre no puede superar 150 caracteres.")
      return
    }

    const precio = parseFloat(formulario.price)
    if (isNaN(precio) || precio <= 0 || precio > 99999999.99) {
      setError("El precio debe ser un número entre 0 y 99,999,999.99.")
      return
    }

    const duracion = parseInt(formulario.duration)
    if (isNaN(duracion) || duracion <= 0 || duracion > 1440) {
      setError("La duración debe ser un número entero entre 1 y 1440 minutos.")
      return
    }

    if (formulario.description.length > 500) {
      setError("La descripción no puede superar 500 caracteres.")
      return
    }

    if (formulario.url && formulario.url.length > 500) {
      setError("La URL de imagen no puede superar 500 caracteres.")
      return
    }

    if (uploadingImage) {
      setError("Por favor espera a que la imagen termine de subirse.")
      return
    }

    try {
      const body = {
        ...formulario,
        price: precio,
        duration: duracion,
        category_id: parseInt(formulario.category_id),
        url: formulario.url || null
      }

      if (editandoId !== null) {
        await fetch(`http://localhost:8080/api/booking/services/${editandoId}`, {
          method: "PATCH", headers, body: JSON.stringify(body)
        })
      } else {
        await fetch("http://localhost:8080/api/booking/services/", {
          method: "POST", headers, body: JSON.stringify(body)
        })
      }
      await cargarServicios()
      setFormulario(formularioVacio)
      setEditandoId(null)
      setMostrarFormulario(false)
    } catch (err) {
      console.error("Error guardando servicio:", err)
      setError("Error al guardar el servicio.")
    }
  }

  const handleEditar = (servicio) => {
    const categoriaEncontrada = categorias.find(cat => cat.name === servicio.category_name)
    setFormulario({
      name: servicio.name,
      price: servicio.price,
      description: servicio.description,
      duration: servicio.duration,
      is_active: servicio.is_active,
      category_id: categoriaEncontrada?.id ?? "",
      url: servicio.image_url || ""
    })
    setEditandoId(servicio.id)
    setMostrarFormulario(true)
    setError("")
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      try {
        await fetch(`http://localhost:8080/api/booking/services/${id}`, { method: "DELETE", headers })
        await cargarServicios()
      } catch (err) {
        console.error("Error eliminando servicio:", err)
        setError("Error al eliminar el servicio.")
      }
    }
  }

  const handleActivar = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/booking/services/${id}/activate`, { method: "PATCH", headers })
      await cargarServicios()
    } catch (err) {
      console.error("Error activando servicio:", err)
      setError("Error al activar el servicio.")
    }
  }

  const handleDesactivar = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/booking/services/${id}/deactivate`, { method: "PATCH", headers })
      await cargarServicios()
    } catch (err) {
      console.error("Error desactivando servicio:", err)
      setError("Error al desactivar el servicio.")
    }
  }

  const handleCancelar = () => {
    setFormulario(formularioVacio)
    setEditandoId(null)
    setMostrarFormulario(false)
    setError("")
  }

  const handleGuardarCat = async () => {
    setErrorCat("")

    if (!formularioCat.name || !formularioCat.description) {
      setErrorCat("El nombre y la descripción son obligatorios.")
      return
    }

    if (formularioCat.name.length > 100) {
      setErrorCat("El nombre no puede superar 100 caracteres.")
      return
    }

    try {
      if (editandoCatId !== null) {
        await fetch(`http://localhost:8080/api/booking/categories/${editandoCatId}`, {
          method: "PATCH", headers, body: JSON.stringify(formularioCat)
        })
      } else {
        await fetch("http://localhost:8080/api/booking/categories", {
          method: "POST", headers, body: JSON.stringify(formularioCat)
        })
      }
      await cargarCategorias()
      setFormularioCat(categoriaVacia)
      setEditandoCatId(null)
      setErrorCat("")
    } catch (err) {
      console.error("Error guardando categoría:", err)
      setErrorCat("Error al guardar la categoría.")
    }
  }

  const handleEditarCat = (cat) => {
    setFormularioCat({ name: cat.name, description: cat.description || "" })
    setEditandoCatId(cat.id)
    setErrorCat("")
  }

  const handleEliminarCat = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await fetch(`http://localhost:8080/api/booking/categories/${id}`, { method: "DELETE", headers })
        await cargarCategorias()
      } catch (err) {
        console.error("Error eliminando categoría:", err)
        setErrorCat("Error al eliminar la categoría.")
      }
    }
  }

  const handleCancelarCat = () => {
    setFormularioCat(categoriaVacia)
    setEditandoCatId(null)
    setErrorCat("")
  }

  return (
    <div className="servicios">
      <div className="servicios_header">
        <h1 className="servicios_titulo">Administrar Servicios</h1>
        <div className="servicios_header_btns">
          <button className="btn_categorias" onClick={() => setMostrarModalCat(true)}>
            🗂 Categorías
          </button>
          <button className="btn_agregar" onClick={() => { setMostrarFormulario(true); setError("") }}>
            + Nuevo Servicio
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="servicios_formulario">
          <h2>{editandoId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
          <div className="formulario_grid">
            <input 
              name="name" 
              placeholder="Nombre (máx. 150 caracteres)" 
              value={formulario.name} 
              onChange={handleChange} 
            />
            <input 
              name="price" 
              placeholder="Precio (máx. 99,999,999.99)" 
              type="number" 
              step="0.01"
              value={formulario.price} 
              onChange={handleChange} 
            />
            <input 
              name="duration" 
              placeholder="Duración en minutos (máx. 1440)" 
              type="number" 
              value={formulario.duration} 
              onChange={handleChange} 
            />
            <input 
              name="description" 
              placeholder="Descripción (máx. 500 caracteres)" 
              value={formulario.description} 
              onChange={handleChange} 
            />
            <select 
              name="category_id" 
              value={formulario.category_id} 
              onChange={handleChange} 
              className="formulario_select"
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="formulario_image_field">
              <label style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                Imagen del servicio:
              </label>
              <ImageUpload 
                onImageUpload={handleImageUpload}
                currentImageUrl={formulario.url}
                onRemoveImage={handleRemoveImage}
              />
            </div>
          </div>
          {error && <p className="form_error">{error}</p>}
          <div className="formulario_botones">
            <button 
              className="btn_guardar" 
              onClick={handleGuardar} 
              disabled={uploadingImage}
            >
              {uploadingImage ? '📤 Subiendo imagen...' : '💾 Guardar'}
            </button>
            <button className="btn_cancelar" onClick={handleCancelar}>
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      <table className="servicios_tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Duración</th>
            <th>Precio</th>
            <th>Imagen</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {servicios.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.description}</td>
              <td>{s.category_name ?? '—'}</td>
              <td>{s.duration} min</td>
              <td>${parseFloat(s.price).toFixed(2)}</td>
              <td>
                {s.image_url ? (
                  <img 
                    src={s.image_url} 
                    alt={s.name} 
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                ) : (
                  <span style={{ color: '#999' }}>Sin imagen</span>
                )}
               </td>
              <td>
                <span className={`badge ${s.is_active ? 'activo' : 'inactivo'}`}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </span>
               </td>
              <td className="acciones">
                <button 
                  className="btn_icono btn_icono_editar" 
                  title="Editar" 
                  onClick={() => handleEditar(s)}
                >
                  ✏️
                </button>
                <button 
                  className="btn_icono btn_icono_eliminar" 
                  title="Eliminar" 
                  onClick={() => handleEliminar(s.id)}
                >
                  🗑
                </button>
                {s.is_active ? (
                  <button 
                    className="btn_icono btn_icono_desactivar" 
                    title="Desactivar" 
                    onClick={() => handleDesactivar(s.id)}
                  >
                    ⏸
                  </button>
                ) : (
                  <button 
                    className="btn_icono btn_icono_activar" 
                    title="Activar" 
                    onClick={() => handleActivar(s.id)}
                    style={{ backgroundColor: '#d1fae5' }}
                  >
                    ▶️
                  </button>
                )}
               </td>
             </tr>
          ))}
        </tbody>
      </table>

      {mostrarModalCat && (
        <div className="modal_overlay" onClick={() => { setMostrarModalCat(false); handleCancelarCat() }}>
          <div className="modal_contenido" onClick={e => e.stopPropagation()}>
            <div className="modal_header">
              <h2>Gestionar Categorías</h2>
              <button className="modal_cerrar" onClick={() => { setMostrarModalCat(false); handleCancelarCat() }}>
                ✕
              </button>
            </div>
            <div className="modal_formulario">
              <input 
                name="name" 
                placeholder="Nombre (máx. 100 caracteres)" 
                value={formularioCat.name} 
                onChange={handleChangeCat} 
              />
              <input 
                name="description" 
                placeholder="Descripción" 
                value={formularioCat.description} 
                onChange={handleChangeCat} 
              />
              <div className="formulario_botones">
                <button className="btn_guardar" onClick={handleGuardarCat}>
                  {editandoCatId ? "🔄 Actualizar" : "➕ Agregar"}
                </button>
                {editandoCatId && (
                  <button className="btn_cancelar" onClick={handleCancelarCat}>
                    ❌ Cancelar
                  </button>
                )}
              </div>
            </div>
            {errorCat && <p className="form_error">{errorCat}</p>}
            <table className="servicios_tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>{cat.description || "—"}</td>
                    <td className="acciones">
                      <button 
                        className="btn_icono btn_icono_editar" 
                        title="Editar" 
                        onClick={() => handleEditarCat(cat)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn_icono btn_icono_eliminar" 
                        title="Eliminar" 
                        onClick={() => handleEliminarCat(cat.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}