// High quality travel imagery mapping by place ID or category
const PLACE_IMAGES: Record<string, string> = {
  // Goa places
  poi_goa_basilica: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop',
  poi_goa_fontainhas: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop',
  poi_goa_fort_aguada: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop',
  poi_goa_calangute_beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  poi_goa_dudhsagar: 'https://images.unsplash.com/photo-1546708973-b339540b5162?w=800&auto=format&fit=crop',
  poi_goa_anjuna_flea: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
  poi_goa_houses_museum: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop',
  poi_goa_se_cathedral: 'https://images.unsplash.com/photo-1548625361-195fe29f104d?w=800&auto=format&fit=crop',
  poi_goa_state_museum: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&auto=format&fit=crop',
  poi_goa_chapora: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
  rest_goa_fisherman_wharf: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop',
  rest_goa_mum_kitchen: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop',
  rest_goa_souza_lobo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
  rest_goa_gunpowder: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop',
  rest_goa_vinayak: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&auto=format&fit=crop',
  hotel_goa_01: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  hotel_goa_02: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
  hotel_goa_03: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',

  // Jaipur places
  poi_jpr_amber_fort: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop',
  poi_jpr_hawa_mahal: 'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?w=800&auto=format&fit=crop',
  poi_jpr_city_palace: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800&auto=format&fit=crop',
  poi_jpr_jantar_mantar: 'https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=800&auto=format&fit=crop',
  poi_jpr_nahargarh: 'https://images.unsplash.com/photo-1585822765369-0b7194f479a4?w=800&auto=format&fit=crop',
  poi_jpr_albert_hall: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
  hotel_jpr_01: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',

  // Hyderabad places
  poi_hyd_charminar: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?w=800&auto=format&fit=crop',
  poi_hyd_golconda_fort: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800&auto=format&fit=crop',
  poi_hyd_chowmahalla: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&auto=format&fit=crop',
  poi_hyd_salarkunj: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&auto=format&fit=crop',
  hotel_hyd_01: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
};

const CATEGORY_IMAGES: Record<string, string> = {
  heritage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop',
  beaches: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  nature: 'https://images.unsplash.com/photo-1546708973-b339540b5162?w=800&auto=format&fit=crop',
  fort: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop',
  museum: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop',
  market: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
  culture: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop',
  seafood: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop',
  goan: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
  hotel: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
  transit: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop',
};

export function getPlaceImage(placeId?: string, category?: string): string {
  if (placeId && PLACE_IMAGES[placeId]) {
    return PLACE_IMAGES[placeId];
  }
  const cleanCat = (category || 'heritage').toLowerCase();
  if (CATEGORY_IMAGES[cleanCat]) {
    return CATEGORY_IMAGES[cleanCat];
  }
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
