export const COSTO_ADOPCION = 10
export const REEMBOLSO_LIBERAR = 5
export const NIVEL_MAX = 10
export const costoNivel = (nivel) => nivel * 15

export const ESPECIES = {
  hielo: {
    nombre: 'Nevadito', animal: 'oso polar', elemento: 'Hielo',
    color: '#f4fbff', borde: '#5b9ec4',
    adorno: { d: 'M50,6 L58,20 L50,32 L42,20 Z', fill: '#8fd3f0' },
  },
  tierra: {
    nombre: 'Roqui', animal: 'tortuga', elemento: 'Tierra',
    color: '#b98a5e', borde: '#7a5232',
    adorno: { d: 'M50,32 C50,20 44,14 34,14 C34,24 40,32 50,32 Z M50,32 C50,20 56,14 66,14 C66,24 60,32 50,32 Z', fill: '#7fc16a' },
  },
  viento: {
    nombre: 'Brisa', animal: 'pájaro', elemento: 'Viento',
    color: '#bff0e6', borde: '#3f9c90',
    adorno: { d: 'M50,32 C44,16 58,8 64,16 C68,24 56,26 56,20', fill: 'none' },
  },
  agua: {
    nombre: 'Gotín', animal: 'pez', elemento: 'Agua',
    color: '#7ec8f2', borde: '#2f73b8',
    adorno: { d: 'M50,6 C57,18 62,24 50,32 C38,24 43,18 50,6 Z', fill: '#d8f0fc' },
  },
  rayo: {
    nombre: 'Chispi', animal: 'luciérnaga', elemento: 'Rayo',
    color: '#ffe066', borde: '#c9871a',
    adorno: { d: 'M54,4 L40,22 L49,22 L45,36 L60,16 L51,16 Z', fill: '#f7931e' },
  },
  fuego: {
    nombre: 'Brasita', animal: 'salamandra', elemento: 'Fuego',
    color: '#ff8a4c', borde: '#c8501f',
    adorno: { d: 'M50,34 C38,22 46,14 50,4 C54,14 64,22 50,34 Z', fill: '#ffd34d' },
  },
}
