// ===== Funções geométricas auxiliares =====

/** Distância entre dois pontos [lat, lng] em metros (Haversine) */
const haversineDistance = (a: [number, number], b: [number, number]): number => {
  const R = 6371000;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinDLon * sinDLon;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/** Encontra o ponto mais próximo em um segmento AB ao ponto P (em coordenadas lat/lng) */
const closestPointOnSegment = (
  A: [number, number],
  B: [number, number],
  P: [number, number]
): [number, number] => {
  const dx = B[1] - A[1];
  const dy = B[0] - A[0];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return A;
  const t = Math.max(0, Math.min(1, ((P[1] - A[1]) * dx + (P[0] - A[0]) * dy) / len2));
  return [A[0] + t * dy, A[1] + t * dx];
};

/** Verifica se qualquer ponto da polyline está dentro do raio de uma interdição */
const findClosestConflict = (
  polyline: [number, number][],
  interdiction: [number, number],
  radius: number
): { segmentIndex: number; closest: [number, number]; distance: number } | null => {
  let minDist = Infinity;
  let bestSeg = -1;
  let bestClosest: [number, number] = polyline[0];

  for (let i = 0; i < polyline.length - 1; i++) {
    const cp = closestPointOnSegment(polyline[i], polyline[i + 1], interdiction);
    const d = haversineDistance(cp, interdiction);
    if (d < minDist) {
      minDist = d;
      bestSeg = i;
      bestClosest = cp;
    }
  }

  if (minDist <= radius) {
    return { segmentIndex: bestSeg, closest: bestClosest, distance: minDist };
  }
  return null;
};

/**
 * Gera um waypoint de desvio perpendicular ao segmento de rota, no lado oposto à interdição.
 * offsetMeters define a distância lateral do desvio em metros.
 */
const generateDetourWaypoint = (
  segA: [number, number],
  segB: [number, number],
  interdiction: [number, number],
  offsetMeters: number = 250
): [number, number] => {
  // Vetor direção do segmento (em graus)
  const dy = segB[0] - segA[0];
  const dx = segB[1] - segA[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular (rotaciona 90°)
  const perpLat = -dx / len;
  const perpLon = dy / len;

  // Ponto médio do segmento
  const midLat = (segA[0] + segB[0]) / 2;
  const midLon = (segA[1] + segB[1]) / 2;

  // Verificar de qual lado a interdição está
  const dotToInter = (interdiction[0] - midLat) * perpLat + (interdiction[1] - midLon) * perpLon;
  // Desviar para o lado OPOSTO à interdição
  const side = dotToInter > 0 ? -1 : 1;

  // Converter offsetMeters para graus (~111 km/grau)
  const offsetDeg = offsetMeters / 111000;

  return [
    midLat + side * perpLat * offsetDeg,
    midLon + side * perpLon * offsetDeg,
  ];
};

// ===== Funções públicas de roteamento =====

/** Rota simples A → B via OSRM */
export const getRoutePolyline = async (
  origin: [number, number],
  dest: [number, number]
): Promise<[number, number][]> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao calcular rota');
    const data = await response.json();
    if (data.code === 'Ok' && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
    }
    return [origin, dest];
  } catch (error) {
    console.error('OSRM API Error:', error);
    return [origin, dest];
  }
};

/** 
 * Rota A → B que tenta evitar todas as interdições ativas.
 * Retorna a polyline calculada e a lista de interdições que foram contornadas.
 */
export const getRoutePolylineAvoidingInterdictions = async (
  origin: [number, number],
  dest: [number, number],
  interdictions: { location: [number, number]; name: string }[],
  avoidanceRadius: number = 180  // metros
): Promise<{ polyline: [number, number][]; avoided: string[] }> => {
  const avoided: string[] = [];
  let waypoints: [number, number][] = [origin, dest];

  // Até 4 iterações para resolver múltiplas interdições
  for (let iteration = 0; iteration < 4; iteration++) {
    // Montar URL multi-waypoint
    const coordString = waypoints.map(w => `${w[1]},${w[0]}`).join(';');
    let polyline: [number, number][];

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) break;
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes.length) break;
      polyline = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][];
    } catch {
      break;
    }

    // Verificar colisões com cada interdição
    let foundConflict = false;
    for (const inter of interdictions) {
      // Pular interdições já evitadas
      if (avoided.includes(inter.name)) continue;

      const conflict = findClosestConflict(polyline, inter.location, avoidanceRadius);
      if (conflict) {
        const segA = polyline[conflict.segmentIndex];
        const segB = polyline[Math.min(conflict.segmentIndex + 1, polyline.length - 1)];
        const detour = generateDetourWaypoint(segA, segB, inter.location, 300);

        // Inserir o waypoint de desvio antes do destino final
        waypoints = [
          waypoints[0],
          ...waypoints.slice(1, -1),
          detour,
          waypoints[waypoints.length - 1]
        ];

        avoided.push(inter.name);
        foundConflict = true;
        break;
      }
    }

    if (!foundConflict) {
      // Sem mais conflitos — calcular a polyline final e retornar
      const coordString = waypoints.map(w => `${w[1]},${w[0]}`).join(';');
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
          const finalPolyline = data.routes[0].geometry.coordinates.map(
            (c: number[]) => [c[1], c[0]]
          ) as [number, number][];
          return { polyline: finalPolyline, avoided };
        }
      } catch {}
      break;
    }
  }

  // Fallback: linha reta se tudo falhar
  return { polyline: [origin, dest], avoided };
};

// ===== Detecção e Desvio de Colisões entre Rotas =====

export interface RouteConflict {
  routeId: string;
  overlapPercentage: number;
  conflictMidpoints: [number, number][];
}

/**
 * Detecta trechos onde uma nova polyline se sobrepõe a rotas ativas existentes.
 * Retorna a lista de conflitos com o ID da rota, percentual de sobreposição
 * e os midpoints dos trechos conflitantes (a serem usados como zonas de desvio).
 */
export const detectRouteConflicts = (
  newPolyline: [number, number][],
  existingRoutes: { id: string; polyline: [number, number][] }[],
  proximityThreshold: number = 40 // metros — mesma pista
): RouteConflict[] => {
  const conflicts: RouteConflict[] = [];

  for (const route of existingRoutes) {
    const conflictIndices: number[] = [];

    for (let i = 0; i < newPolyline.length; i++) {
      for (let j = 0; j < route.polyline.length; j++) {
        if (haversineDistance(newPolyline[i], route.polyline[j]) < proximityThreshold) {
          conflictIndices.push(i);
          break;
        }
      }
    }

    if (conflictIndices.length === 0) continue;

    const overlapPercentage = (conflictIndices.length / newPolyline.length) * 100;

    // Agrupa índices consecutivos e extrai o midpoint de cada grupo
    const midpoints: [number, number][] = [];
    let groupStart = conflictIndices[0];
    for (let k = 1; k <= conflictIndices.length; k++) {
      const isEnd = k === conflictIndices.length;
      const isBreak = !isEnd && conflictIndices[k] !== conflictIndices[k - 1] + 1;
      if (isEnd || isBreak) {
        const groupEnd = conflictIndices[k - 1];
        const midIdx = Math.floor((groupStart + groupEnd) / 2);
        midpoints.push(newPolyline[midIdx]);
        if (!isEnd) groupStart = conflictIndices[k];
      }
    }

    // Só reporta se a sobreposição for relevante (>= 15%)
    if (overlapPercentage >= 15) {
      conflicts.push({ routeId: route.id, overlapPercentage, conflictMidpoints: midpoints });
    }
  }

  return conflicts;
};

/**
 * Calcula uma rota A → B evitando interdições E trechos já ocupados por rotas ativas.
 * Os midpoints conflitantes são tratados como interdições virtuais.
 */
export const getRoutePolylineAvoidingAll = async (
  origin: [number, number],
  dest: [number, number],
  interdictions: { location: [number, number]; name: string }[],
  activeRoutes: { id: string; polyline: [number, number][] }[],
  avoidanceRadius: number = 180
): Promise<{
  polyline: [number, number][];
  avoidedInterdictions: string[];
  conflicts: RouteConflict[];
  alternativeFound: boolean;
}> => {
  // Passo 1: calcular rota evitando interdições
  const step1 = await getRoutePolylineAvoidingInterdictions(origin, dest, interdictions, avoidanceRadius);
  let currentPolyline = step1.polyline;
  const avoidedInterdictions = step1.avoided;

  // Passo 2: detectar conflitos com rotas ativas
  const conflicts = detectRouteConflicts(currentPolyline, activeRoutes);
  if (conflicts.length === 0) {
    return { polyline: currentPolyline, avoidedInterdictions, conflicts: [], alternativeFound: true };
  }

  // Passo 3: usar midpoints conflitantes como interdições virtuais e tentar rerrotar
  const virtualInterdictions = conflicts.flatMap(c =>
    c.conflictMidpoints.map((pt, i) => ({
      location: pt,
      name: `trecho-${c.routeId}-${i}`
    }))
  );

  const step3 = await getRoutePolylineAvoidingInterdictions(
    origin, dest,
    [...interdictions, ...virtualInterdictions],
    avoidanceRadius
  );

  // Verificar se a alternativa reduziu o conflito
  const remainingConflicts = detectRouteConflicts(step3.polyline, activeRoutes);
  const totalOriginalOverlap = conflicts.reduce((s, c) => s + c.overlapPercentage, 0);
  const totalRemainingOverlap = remainingConflicts.reduce((s, c) => s + c.overlapPercentage, 0);

  const improved = totalRemainingOverlap < totalOriginalOverlap * 0.5; // reduziu >= 50%

  return {
    polyline: improved ? step3.polyline : currentPolyline,
    avoidedInterdictions,
    conflicts,
    alternativeFound: improved
  };
};
