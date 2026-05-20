import React, { useEffect, useState } from 'react'
import ServicesCard from '../ServicesCard/ServicesCard';
import './HourFrontServices.css'

const HourFrontServices = () => {
  const [hour, setHour] = useState(`${new Date().getHours().toString().padStart(2, '0')}:00`)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const updateHour = () => {
      setHour(`${new Date().getHours().toString().padStart(2, '0')}:00`);
    };

    const now = new Date();
    const msToNextHour =
      (60 - now.getMinutes()) * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds();

    const timeout = setTimeout(() => {
      updateHour();

      const interval = setInterval(updateHour, 60 * 60 * 1000);

      return () => clearInterval(interval);
    }, msToNextHour);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        if (!token) {
          setError('Token no encontrado')
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:8080/api/booking/reservations/upcoming', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          setReservations(data.data)
          setError(null)
        } else {
          setError('Error en la respuesta del servidor')
        }
      } catch (err) {
        setError(err.message)
        console.error('Error fetching reservations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [])

  if (loading) {
    return <div className='loading-container'>Cargando reservas...</div>
  }

  if (error) {
    return <div className='error-container'>Error: {error}</div>
  }
  console.log('Reservations data:', reservations)

  return (
    <div>
        <div className='divider'></div>
        <div className='services-container'>
          <div className='title-wrapper'>
            <h1>Reservas para HOY 💧</h1>
           
          </div>
          <ServicesCard currentHour={hour} reservations={reservations}/>
        </div>
    </div>
  )
}

export default HourFrontServices