export const LOCATIONS = {
  global:     { lat: 20,      lon: 0,       alt: 20000000, label: 'Global View' },
  nepal:      { lat: 28.3949, lon: 84.1240, alt: 1500000,  label: 'Nepal' },
  kathmandu:  { lat: 27.7172, lon: 85.3240, alt: 50000,    label: 'Kathmandu' },
  pokhara:    { lat: 28.2096, lon: 83.9856, alt: 30000,    label: 'Pokhara' },
  middleEast: { lat: 27,      lon: 45,      alt: 5000000,  label: 'Middle East' },
  europe:     { lat: 54,      lon: 15,      alt: 5000000,  label: 'Europe' },
}

export const SHORTCUTS: Record<string, keyof typeof LOCATIONS> = {
  '1': 'global', '2': 'nepal', '3': 'kathmandu',
  '4': 'pokhara', '5': 'middleEast', '6': 'europe'
}
