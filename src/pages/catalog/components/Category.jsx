import Card from './Card';

function Category(props) {
  return (
    <div className="categoria">
      <h2>{props.titulo}</h2>
      <div className="tarjetas_container">
        {props.servicios.map((servicio) => (
          <Card
            key={servicio.id}
            imagen={servicio.imagen}
            name={servicio.name}
            description={servicio.description}
            duration={servicio.duration}
            price={servicio.precioFormateado}
          />
        ))}
      </div>
    </div>
  );
}

export default Category;