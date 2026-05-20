import React from 'react'
import './Footer.css'
const Footer = () => {
  return (
    <>
    <footer className='footer'>
        <div className='footer-left'>
            <h3>Grupo aguapanelita</h3>
            <p>Lavado profesional de vehiculos</p>
        </div>
        <div className='footer-mid'>
            <h4>Politicas</h4>
            <a href="">Terminos y servicios</a>
        </div>
        <div className='footer-right'>
            <h4>Contactanos</h4>
            <ul className='footer-info'>
                <li>Direccion</li>
                <li>Telefono</li>
                <li>Email</li>
            </ul>
        </div>
         <div className='footer-bottom'>
        <p>&copy; 2026 Grupo Aguapanelita. Todos los derechos reservados</p>
    </div>
    </footer>
   
    </>
  )
}

export default Footer