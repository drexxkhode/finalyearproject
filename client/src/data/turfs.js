// ─── Turf photo sets (Unsplash) ───────────────────────────────────────────
export const TURF_PHOTOS = {
  1: [
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc595d15b4?w=800&q=80',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
  ],
  2: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80',
  ],
  3: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
  ],
  4: [
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
  ],
}

// ─── Turf records ─────────────────────────────────────────────────────────
export const TURFS = [
  {
    id: 1,
    name: 'Accra Sports City',
    location: 'Cantonments, Accra',
    lat: 5.5913, lng: -0.1775,
    rating: 4.8,
    pricePerHour: 250,
    surface: 'Premium Astro Turf',
    capacity: '5-a-side',
    amenities: ['Floodlights', 'Changing Rooms', 'Parking', 'Canteen'],
    distance: '1.2 km',
  },
  {
    id: 2,
    name: 'GreenField Arena',
    location: 'Osu, Accra',
    lat: 5.5534, lng: -0.1844,
    rating: 4.5,
    pricePerHour: 180,
    surface: 'Synthetic Grass',
    capacity: '7-a-side',
    amenities: ['Floodlights', 'Changing Rooms', 'CCTV'],
    distance: '2.8 km',
  },
  {
    id: 3,
    name: 'Labadi Kick Arena',
    location: 'Labadi, Accra',
    lat: 5.5502, lng: -0.1365,
    rating: 4.2,
    pricePerHour: 150,
    surface: 'Astro Turf',
    capacity: '5-a-side',
    amenities: ['Floodlights', 'Parking'],
    distance: '4.1 km',
  },
  {
    id: 4,
    name: 'AMA Premier Pitch',
    location: 'Accra Central',
    lat: 5.5471, lng: -0.2055,
    rating: 4.6,
    pricePerHour: 200,
    surface: 'FIFA Certified Turf',
    capacity: '11-a-side',
    amenities: ['Floodlights', 'VIP Lounge', 'Changing Rooms', 'Parking', 'Canteen', 'Medical Room'],
    distance: '3.5 km',
  },
]

// ─── Seed enquiries ───────────────────────────────────────────────────────
export const SEED_ENQUIRIES = {
  1: [
    { id: 'e1', user: 'Kofi A.',  msg: 'Is parking available on weekends?',      time: '2 hrs ago',  reply: 'Yes, free parking for all bookings!' },
    { id: 'e2', user: 'Ama S.',   msg: 'Can we book for a birthday party event?', time: '1 day ago',  reply: 'Absolutely! Contact us for group packages.' },
  ],
  2: [
    { id: 'e3', user: 'Yaw B.',   msg: 'Do you have changing room facilities?',   time: '3 hrs ago',  reply: 'Yes, clean changing rooms available.' },
  ],
  3: [],
  4: [
    { id: 'e4', user: 'Abena M.', msg: 'Is the VIP lounge included in regular booking?', time: '5 hrs ago', reply: 'VIP lounge requires a separate add-on fee of ₵50.' },
  ],
}

// ─── Slot generator ───────────────────────────────────────────────────────
export function makeSlots() {
  return [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => ({
    hour: h,
    label: `${h}:00 - ${h + 1}:00`,
    status: Math.random() > 0.55 ? 'available' : 'booked',
    lockedBy: null,
  }))
}
