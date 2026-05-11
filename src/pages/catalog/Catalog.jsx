import { useState, useEffect } from 'react'
import Category from './components/Category';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import carGenerico from '../../assets/car1.jpg'
import './Catalog.css'

function Catalog() {
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = { "Authorization": `Bearer ${token}` }

        const [resCat, resServ] = await Promise.all([
          fetch("http://localhost:8080/api/booking/categories", { headers }),
          fetch("http://localhost:8080/api/booking/services/", { headers })
        ])

        const dataCat = await resCat.json()
        const dataServ = await resServ.json()

        console.log("Categorias:", dataCat)  // ← aquí
        console.log("Servicios:", dataServ)  // ← aquí

        const cats = dataCat.data || dataCat
        const servs = dataServ.data || dataServ

        const categoriasConServicios = cats.map(cat => ({
          id: cat.id,
          titulo: cat.name,
          servicios: servs
            .filter(s => s.category_name === cat.name)
            .map(s => ({ ...s, imagen: carGenerico }))
        })).filter(cat => cat.servicios.length > 0)

        setCategorias(categoriasConServicios)
      } catch (err) {
        console.error("Error cargando catálogo:", err)
      }
    }

    cargarCatalogo()
  }, [])

  return (
    <>
      <Navbar />
      <div className="catalogo">
        {categorias.map((categoria) => (
          <Category
            key={categoria.id}
            titulo={categoria.titulo}
            servicios={categoria.servicios}
          />
        ))}
      </div>
      <Footer />
    </>
  );
}

export default Catalog;