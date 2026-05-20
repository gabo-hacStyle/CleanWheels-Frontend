import { useState, useEffect } from 'react';
import Category from './components/Category';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import carGenerico from '../../assets/car1.jpg';
import './Catalog.css';

function Catalog() {
  const [categorias, setCategorias] = useState([]);

  const formatPrecio = (valor) => {
    if (!valor) return "0";
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  useEffect(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}, []);

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [resCat, resServ] = await Promise.all([
          fetch("http://localhost:8080/api/booking/categories", { headers }),
          fetch("http://localhost:8080/api/booking/services/", { headers })
        ]);

        const dataCat = await resCat.json();
        const dataServ = await resServ.json();

        const cats = dataCat.data || dataCat;
        const servs = dataServ.data || dataServ;

        const categoriasConServicios = cats.map(cat => ({
          id: cat.id,
          titulo: cat.name,
          servicios: servs
            .filter(s => s.category_name === cat.name)
            .map(s => ({ 
              ...s, 
              imagen: s.image_url || carGenerico,
              precioFormateado: formatPrecio(s.price || s.precio) 
            }))
        })).filter(cat => cat.servicios.length > 0);

        setCategorias(categoriasConServicios);
      } catch (err) {
        console.error("Error cargando catálogo:", err);
      }
    };

    cargarCatalogo();
  }, []);

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