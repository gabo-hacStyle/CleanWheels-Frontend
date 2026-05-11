import { useState, useEffect } from 'react'
import './Servicios.css'

const formularioVacio = { name: "", price: "", description: "", duration: "", is_active: true, category_id: "" }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormulario(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleChangeCat = (e) => {
    const { name, value } = e.target
    setFormularioCat(prev => ({ ...prev, [name]: value }))
  }

  const handleGuardar = async () => {
    if (!formulario.name || !formulario.price || !formulario.description || !formulario.duration || !formulario.category_id) return
    try {
      if (editandoId !== null) {
        await fetch(`http://localhost:8080/api/booking/services/${editandoId}`, {
          method: "PATCH", headers, body: JSON.stringify(formulario)
        })
      } else {
        await fetch("http://localhost:8080/api/booking/services/", {
          method: "POST", headers, body: JSON.stringify(formulario)
        })
      }
      await cargarServicios()
      setFormulario(formularioVacio)
      setEditandoId(null)
      setMostrarFormulario(false)
    } catch (err) {
      console.error("Error guardando servicio:", err)
    }
  }

  const handleEditar = (servicio) => {
    setFormulario(servicio)
    setEditandoId(servicio.id)
    setMostrarFormulario(true)
  }

  const handleEliminar = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/booking/services/${id}`, { method: "DELETE", headers })
      await cargarServicios()
    } catch (err) {
      console.error("Error eliminando servicio:", err)
    }
  }

  const handleDesactivar = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/booking/services/${id}/deactivate`, { method: "PATCH", headers })
      await cargarServicios()
    } catch (err) {
      console.error("Error desactivando servicio:", err)
    }
  }

  const handleCancelar = () => {
    setFormulario(formularioVacio)
    setEditandoId(null)
    setMostrarFormulario(false)
  }

  const handleGuardarCat = async () => {
    if (!formularioCat.name) return
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
    } catch (err) {
      console.error("Error guardando categoría:", err)
    }
  }

  const handleEditarCat = (cat) => {
    setFormularioCat({ name: cat.name, description: cat.description || "" })
    setEditandoCatId(cat.id)
  }

  const handleEliminarCat = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/booking/categories/${id}`, { method: "DELETE", headers })
      await cargarCategorias()
    } catch (err) {
      console.error("Error eliminando categoría:", err)
    }
  }

  const handleCancelarCat = () => {
    setFormularioCat(categoriaVacia)
    setEditandoCatId(null)
  }

  return (
    <div className="servicios">
      <div className="servicios_header">
        <h1 className="servicios_titulo">Administrar Servicios</h1>
        <div className="servicios_header_btns">
          <button className="btn_categorias" onClick={() => setMostrarModalCat(true)}>
            🗂 Categorías
          </button>
          <button className="btn_agregar" onClick={() => setMostrarFormulario(true)}>
            + Nuevo Servicio
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="servicios_formulario">
          <h2>{editandoId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
          <div className="formulario_grid">
            <input name="name" placeholder="Nombre" value={formulario.name} onChange={handleChange} />
            <input name="price" placeholder="Precio" value={formulario.price} onChange={handleChange} />
            <input name="duration" placeholder="Duración (min)" value={formulario.duration} onChange={handleChange} />
            <input name="description" placeholder="Descripción" value={formulario.description} onChange={handleChange} />
            <select name="category_id" value={formulario.category_id} onChange={handleChange} className="formulario_select">
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <label className="formulario_check">
              <input type="checkbox" name="is_active" checked={formulario.is_active} onChange={handleChange} />
              Activo
            </label>
          </div>
          <div className="formulario_botones">
            <button className="btn_guardar" onClick={handleGuardar}>Guardar</button>
            <button className="btn_cancelar" onClick={handleCancelar}>Cancelar</button>
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
              <td>${s.price}</td>
              <td>
                <span className={`badge ${s.is_active ? 'activo' : 'inactivo'}`}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="acciones">
                <button className="btn_icono btn_icono_editar" title="Editar" onClick={() => handleEditar(s)}>✏️</button>
                <button className="btn_icono btn_icono_eliminar" title="Eliminar" onClick={() => handleEliminar(s.id)}>🗑</button>
                {s.is_active && (
                  <button className="btn_icono btn_icono_desactivar" title="Desactivar" onClick={() => handleDesactivar(s.id)}>⏸</button>
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
              <button className="modal_cerrar" onClick={() => { setMostrarModalCat(false); handleCancelarCat() }}>✕</button>
            </div>
            <div className="modal_formulario">
              <input name="name" placeholder="Nombre de categoría" value={formularioCat.name} onChange={handleChangeCat} />
              <input name="description" placeholder="Descripción (opcional)" value={formularioCat.description} onChange={handleChangeCat} />
              <div className="formulario_botones">
                <button className="btn_guardar" onClick={handleGuardarCat}>
                  {editandoCatId ? "Actualizar" : "Agregar"}
                </button>
                {editandoCatId && (
                  <button className="btn_cancelar" onClick={handleCancelarCat}>Cancelar</button>
                )}
              </div>
            </div>
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
                      <button className="btn_icono btn_icono_editar" title="Editar" onClick={() => handleEditarCat(cat)}>✏️</button>
                      <button className="btn_icono btn_icono_eliminar" title="Eliminar" onClick={() => handleEliminarCat(cat.id)}>🗑</button>
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