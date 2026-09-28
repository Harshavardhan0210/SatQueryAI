/**
 * Sample Satellite Scenarios & Image Data Utilities
 * High-fidelity procedural satellite crops with realistic spectral signatures
 */

export interface SampleDataset {
  id: string;
  name: string;
  location: string;
  coordinates: string;
  beforeDate: string;
  afterDate: string;
  sensor: string;
  resolution: string;
  description: string;
  expectedDynamic: string;
  suggestedQueries: string[];
}

export interface ValidationCase {
  id: string;
  name: string;
  location: string;
  shapeMorphology: string;
  trueLandCover: 'WATER_BODY' | 'VEGETATION_CANOPY' | 'MIXED_TRANSITION' | 'BURN_SCAR';
  computedNDWI: number;
  computedNDVI: number;
  jrcWaterRecurrencePct: number;
  rawVlmPrediction: string;
  rawVlmConfidence: number;
  rawVlmReasoning: string;
  groundedAnswer: string;
  calibratedConfidence: number;
  calibratedJustification: string;
  spectralAgreement: 'AGREED' | 'SPECTRAL_CONFLICT_INTERCEPTED' | 'SHAPE_BIAS_OVERRIDDEN';
  benchmarkSource: 'SWED' | 'BigEarthNet.txt' | 'Kaggle Water Bodies' | 'EuroSAT SeaLake' | 'DeepGlobe' | 'JRC GSW';
}

export interface WaterDatasetRef {
  name: string;
  keyUtility: string;
  resolution: string;
  sampleCount: string;
  hardNegativeTarget: string;
  sourceUrl: string;
}

export const WATER_DATASET_REFERENCES: WaterDatasetRef[] = [
  {
    name: 'SWED (Sentinel-2 Water Edges Dataset)',
    keyUtility: 'High-precision water/land boundary segmentation with sub-pixel edge alignment.',
    resolution: '10m MSI (B2, B3, B4, B8)',
    sampleCount: '28,102 polygon chips',
    hardNegativeTarget: 'Forked estuaries, dendritic reservoir margins vs. riparian bank vegetation.',
    sourceUrl: 'https://github.com/satellite-image-deep-learning/SWED',
  },
  {
    name: 'Kaggle Satellite Images of Water Bodies',
    keyUtility: 'Broad morphological diversity across 2,841 globally distributed lakes and reservoirs.',
    resolution: 'Multispectral 10m-30m',
    sampleCount: '2,841 paired mask scenes',
    hardNegativeTarget: 'Multi-armed dendritic impoundments, artificial dams with finger bays.',
    sourceUrl: 'https://www.kaggle.com/datasets/franciscoescobar/satellite-images-of-water-bodies',
  },
  {
    name: 'EuroSAT (SeaLake Class)',
    keyUtility: 'Standardized Sentinel-2 13-band benchmark containing clean SeaLake vs. Forest tiles.',
    resolution: '10m (13 Sentinel-2 bands)',
    sampleCount: '27,000 labeled patches (3,000 SeaLake)',
    hardNegativeTarget: 'Contrastive pair mining: SeaLake tiles vs. Dense Forest / Coniferous stands.',
    sourceUrl: 'https://github.com/phelber/eurosat',
  },
  {
    name: 'DeepGlobe Land Cover Classification',
    keyUtility: 'Pixel-level multi-class ground truth for water vs. forest vs. barren/urban.',
    resolution: '50cm DigitalGlobe VHR',
    sampleCount: '1,146 sub-meter scenes',
    hardNegativeTarget: 'Dendritic drainage ditches and arborized forest corridors side-by-side.',
    sourceUrl: 'https://competitions.codalab.org/competitions/18468',
  },
  {
    name: 'JRC Global Surface Water (Google Earth Engine)',
    keyUtility: '38-year global surface water occurrence & recurrence mapping (1984-present).',
    resolution: '30m Landsat global composite',
    sampleCount: 'Global Earth Surface Grids',
    hardNegativeTarget: 'Automated ground-truth pseudo-mask generator for ANY arbitrary scene without human labeling.',
    sourceUrl: 'https://global-surface-water.appspot.com/',
  },
];

export const VALIDATION_BATCH_CASES: ValidationCase[] = [
  {
    id: 'val-mead-dendritic',
    name: 'Lake Mead Overton Arm (Forked Inlets)',
    location: 'Nevada, USA (36.42°N, 114.38°W)',
    shapeMorphology: 'Dendritic Branching / Arborized Canyon Inlets',
    trueLandCover: 'WATER_BODY',
    computedNDWI: 0.64,
    computedNDVI: -0.19,
    jrcWaterRecurrencePct: 98.4,
    rawVlmPrediction: 'Dendritic tree root systems / riparian forest canopy',
    rawVlmConfidence: 0.84,
    rawVlmReasoning: 'Model pattern-matched the branching dendritic geometry to natural-image tree crowns and roots.',
    groundedAnswer: 'Verified open water reservoir body. The branching geometry is a flooded desert canyon estuary; physical spectral bands confirm NDWI = +0.64 and NDVI = -0.19, conclusively ruling out vegetation.',
    calibratedConfidence: 0.98,
    calibratedJustification: 'NDWI = +0.64 establishes open water; NDVI = -0.19 proves zero chlorophyll absorption. Shape bias rejected.',
    spectralAgreement: 'SHAPE_BIAS_OVERRIDDEN',
    benchmarkSource: 'Kaggle Water Bodies',
  },
  {
    id: 'val-powell-canyon',
    name: 'Lake Powell Cataract Canyon Tributaries',
    location: 'Utah / Arizona, USA (37.06°N, 111.24°W)',
    shapeMorphology: 'Dendritic Flooded Canyon Fingers',
    trueLandCover: 'WATER_BODY',
    computedNDWI: 0.71,
    computedNDVI: -0.22,
    jrcWaterRecurrencePct: 99.1,
    rawVlmPrediction: 'Dense branching vegetation canopy along mountain crevasse',
    rawVlmConfidence: 0.79,
    rawVlmReasoning: 'Forked fingers mistaken for arborized foliage network.',
    groundedAnswer: 'Deep canyon reservoir waters. Despite arborized appearance, near-black optical reflectance and NDWI = +0.71 establish standing water.',
    calibratedConfidence: 0.99,
    calibratedJustification: 'Near-zero NIR reflectance + positive NDWI (+0.71) establish water body.',
    spectralAgreement: 'SHAPE_BIAS_OVERRIDDEN',
    benchmarkSource: 'SWED',
  },
  {
    id: 'val-plumas-ridge',
    name: 'Plumas National Forest Ridge Timber',
    location: 'California, USA (39.98°N, 120.91°W)',
    shapeMorphology: 'Dendritic Mountain Drainage Ridge',
    trueLandCover: 'VEGETATION_CANOPY',
    computedNDWI: -0.34,
    computedNDVI: 0.76,
    jrcWaterRecurrencePct: 0.0,
    rawVlmPrediction: 'Dense conifer forest canopy on mountain ridge',
    rawVlmConfidence: 0.91,
    rawVlmReasoning: 'High greenness and organic texture classified as forest.',
    groundedAnswer: 'Healthy coniferous forest canopy. Physical NIR plateau and NDVI = +0.76 corroborate dense living biomass.',
    calibratedConfidence: 0.96,
    calibratedJustification: 'NDVI = +0.76 and negative NDWI (-0.34) align with photosynthetic vegetation canopy.',
    spectralAgreement: 'AGREED',
    benchmarkSource: 'BigEarthNet.txt',
  },
  {
    id: 'val-swed-estuary',
    name: 'SWED Sentinel-2 Severn Estuary Water Edge',
    location: 'United Kingdom (51.52°N, 2.71°W)',
    shapeMorphology: 'Forked Estuarine Tidal Channels',
    trueLandCover: 'WATER_BODY',
    computedNDWI: 0.58,
    computedNDVI: -0.11,
    jrcWaterRecurrencePct: 94.7,
    rawVlmPrediction: 'Braided marshland vegetation / root structures',
    rawVlmConfidence: 0.72,
    rawVlmReasoning: 'Braided channel network confused with plant root network.',
    groundedAnswer: 'Tidal estuarine water channels. High water index (+0.58) and low NIR signal verify water presence.',
    calibratedConfidence: 0.95,
    calibratedJustification: 'SWED ground-truth mask and NDWI = +0.58 verify water surface.',
    spectralAgreement: 'SPECTRAL_CONFLICT_INTERCEPTED',
    benchmarkSource: 'SWED',
  },
  {
    id: 'val-eurosat-sealake',
    name: 'EuroSAT SeaLake Benchmark Patch #4182',
    location: 'Central Finland (62.24°N, 25.74°E)',
    shapeMorphology: 'Irregular Lake with Finger Bays',
    trueLandCover: 'WATER_BODY',
    computedNDWI: 0.62,
    computedNDVI: -0.14,
    jrcWaterRecurrencePct: 100.0,
    rawVlmPrediction: 'Inland freshwater lake surface',
    rawVlmConfidence: 0.88,
    rawVlmReasoning: 'Clear water optical contrast with surrounding terrain.',
    groundedAnswer: 'Inland oligotrophic lake surface. Confirmed by EuroSAT SeaLake ground truth and NDWI = +0.62.',
    calibratedConfidence: 0.97,
    calibratedJustification: 'Consistent optical water signature and high NDWI agreement.',
    spectralAgreement: 'AGREED',
    benchmarkSource: 'EuroSAT SeaLake',
  },
  {
    id: 'val-deepglobe-riparian',
    name: 'DeepGlobe Riparian River Corridor',
    location: 'South America (14.28°S, 51.12°W)',
    shapeMorphology: 'Meandering / Branching River Corridor',
    trueLandCover: 'VEGETATION_CANOPY',
    computedNDWI: -0.08,
    computedNDVI: 0.68,
    jrcWaterRecurrencePct: 12.3,
    rawVlmPrediction: 'Gallery forest along river drainage basin',
    rawVlmConfidence: 0.85,
    rawVlmReasoning: 'Narrow green strip along drainage path.',
    groundedAnswer: 'Dense riparian gallery forest. High canopy NDVI (+0.68) verifies continuous tree cover buffering the stream.',
    calibratedConfidence: 0.94,
    calibratedJustification: 'Chlorophyll absorption in red band confirms living forest foliage.',
    spectralAgreement: 'AGREED',
    benchmarkSource: 'DeepGlobe',
  },
  {
    id: 'val-amazon-fishbone',
    name: 'Amazon Rondônia Deforestation Corridor',
    location: 'Brazil (10.82°S, 62.91°W)',
    shapeMorphology: 'Dendritic / Orthogonal Road Clearing',
    trueLandCover: 'MIXED_TRANSITION',
    computedNDWI: -0.26,
    computedNDVI: 0.38,
    jrcWaterRecurrencePct: 0.0,
    rawVlmPrediction: 'Agricultural access roads and pasture clearcuts in rainforest',
    rawVlmConfidence: 0.93,
    rawVlmReasoning: 'Geometric fishbone road network visible against forest.',
    groundedAnswer: 'Deforestation front: high-contrast contrast between cleared soil (NDVI < 0.2) and remnant primary rainforest canopy (NDVI > 0.75).',
    calibratedConfidence: 0.96,
    calibratedJustification: 'Delta NDVI (-0.34) confirms mechanical canopy removal.',
    spectralAgreement: 'AGREED',
    benchmarkSource: 'BigEarthNet.txt',
  },
  {
    id: 'val-kag-reservoir',
    name: 'Kaggle Water Bodies Dam Impoundment #1094',
    location: 'Spain (39.51°N, 5.29°W)',
    shapeMorphology: 'Dendritic Multi-Armed Reservoir',
    trueLandCover: 'WATER_BODY',
    computedNDWI: 0.67,
    computedNDVI: -0.21,
    jrcWaterRecurrencePct: 97.8,
    rawVlmPrediction: 'Sprawling tree canopy / branched forest grove',
    rawVlmConfidence: 0.82,
    rawVlmReasoning: 'Branching inlet morphology tricked raw vision encoder.',
    groundedAnswer: 'Artificial reservoir impoundment with branching flooded canyons. NDWI = +0.67 proves open water despite arborized shape.',
    calibratedConfidence: 0.98,
    calibratedJustification: 'Near-infrared absorption and NDWI = +0.67 strictly rule out vegetative canopy.',
    spectralAgreement: 'SHAPE_BIAS_OVERRIDDEN',
    benchmarkSource: 'Kaggle Water Bodies',
  },
];

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'lake-mead-drought',
    name: 'Lake Mead Dendritic Reservoir',
    location: 'Nevada / Arizona Border, USA',
    coordinates: '36°08\'N, 114°44\'W',
    beforeDate: 'April 2020',
    afterDate: 'July 2024',
    sensor: 'Landsat 8-9 OLI / Sentinel-2 MSI (10m)',
    resolution: '10m / px',
    description: 'Dendritic / branching flooded canyon inlets (Overton Arm & Virgin Basin). Demonstrates the classic VLM shape-confusion failure mode where branching lake inlets are hallucinated as "tree roots" or "forest canopy" unless grounded by deterministic NDWI (+0.64).',
    expectedDynamic: 'Substantial water surface loss (-NDWI) exposing mineral bathtub ring along forked inlets.',
    suggestedQueries: [
      'Is this branching dendritic structure open water or tree canopy?',
      'How much open water surface has been lost since April 2020?',
      'Evaluate the spectral NDWI vs NDVI signature of the forked inlets.',
      'Explain the bathtub ring exposure along the dendritic shoreline.',
    ],
  },
  {
    id: 'swed-water-edges',
    name: 'SWED Sentinel-2 Water Edges Benchmark',
    location: 'Severn Estuary / Coastal Bay',
    coordinates: '51°32\'N, 2°43\'W',
    beforeDate: 'May 2021',
    afterDate: 'September 2024',
    sensor: 'Sentinel-2 MSI (B2, B3, B4, B8 at 10m)',
    resolution: '10m / px',
    description: 'Specialized water-land boundary benchmark from the Sentinel-2 Water Edges Dataset (SWED). Features branching tidal inlets and reservoir fingers evaluated against ground-truth JRC Global Surface Water occurrence.',
    expectedDynamic: 'Tidal channel shifting, marshland water recession, and sub-pixel shoreline edge retreat.',
    suggestedQueries: [
      'Classify the dendritic inlet network using spectral NDWI.',
      'Identify any contradictions between visual branching shape and spectral water bands.',
      'What is the verified JRC surface water occurrence percentage?',
      'Locate the primary water body recession cluster and extract its bounding box.',
    ],
  },
  {
    id: 'amazon-deforestation',
    name: 'Amazon Rainforest Clearing',
    location: 'Rondônia, Brazil',
    coordinates: '10°49\'S, 62°55\'W',
    beforeDate: 'June 2021',
    afterDate: 'August 2024',
    sensor: 'Sentinel-2 MSI (Simulated 10m)',
    resolution: '10m / px',
    description: 'Systematic "fishbone" agricultural access roads and clear-cut pasture conversion across primary tropical rainforest canopy.',
    expectedDynamic: 'Severe vegetation loss (-NDVI) with high geometric fragmentation in the North-East and Central quadrants.',
    suggestedQueries: [
      'What changed here since June 2021?',
      'Quantify the primary rainforest canopy loss in hectares and percent.',
      'Which spatial quadrants suffered the most severe clearing?',
      'Is there any evidence of forest recovery or revegetation?',
    ],
  },
  {
    id: 'california-burn-scar',
    name: 'Sierra Nevada Wildfire Burn Scar',
    location: 'Plumas National Forest, California',
    coordinates: '39°58\'N, 120°54\'W',
    beforeDate: 'May 2022',
    afterDate: 'September 2024',
    sensor: 'Sentinel-2 MSI (Simulated 10m)',
    resolution: '10m / px',
    description: 'High-severity wildfire burn perimeter across conifer timber stands, leaving charcoal ash scars and scorched soil.',
    expectedDynamic: 'Sudden collapse of canopy NDVI with high spectral contrast between charred burn scar and unburned refugia.',
    suggestedQueries: [
      'Quantify the total burn perimeter and severity across the scene.',
      'Did any unburned forest islands or refugia survive?',
      'What is the difference in spectral signature between the burn scar and healthy canopy?',
      'Has any revegetation begun in the affected quadrants?',
    ],
  },
  {
    id: 'urban-expansion-dubai',
    name: 'Dubai Coastal Expansion',
    location: 'Dubai Coastal District, UAE',
    coordinates: '25°12\'N, 55°14\'E',
    beforeDate: 'October 2019',
    afterDate: 'February 2025',
    sensor: 'PlanetScope Ortho (Simulated 3m)',
    resolution: '3m / px',
    description: 'Rapid desert sand dune transformation into coastal infrastructure, arterial highway networks, and irrigated turf.',
    expectedDynamic: 'High spectral albedo change (+RGB), road network grid construction, and pockets of localized irrigated greening.',
    suggestedQueries: [
      'What new infrastructure was constructed between 2019 and 2025?',
      'Is there any increase in irrigated vegetation amidst the urban development?',
      'Quantify the overall surface transformation footprint.',
      'What are the characteristics of the largest contiguous construction cluster?',
    ],
  },
];

/**
 * Generate synthetic high-detail satellite imagery pairs with realistic spatial patterns
 */
export function generateSamplePair(id: string, size = 512): { before: ImageData; after: ImageData } {
  const canvasBefore = document.createElement('canvas');
  const canvasAfter = document.createElement('canvas');
  canvasBefore.width = size;
  canvasBefore.height = size;
  canvasAfter.width = size;
  canvasAfter.height = size;

  const ctxB = canvasBefore.getContext('2d')!;
  const ctxA = canvasAfter.getContext('2d')!;

  switch (id) {
    case 'amazon-deforestation':
      renderAmazonPair(ctxB, ctxA, size);
      break;
    case 'lake-mead-drought':
      renderLakeMeadPair(ctxB, ctxA, size);
      break;
    case 'swed-water-edges':
      renderSwedPair(ctxB, ctxA, size);
      break;
    case 'urban-expansion-dubai':
      renderUrbanPair(ctxB, ctxA, size);
      break;
    case 'california-burn-scar':
      renderWildfirePair(ctxB, ctxA, size);
      break;
    default:
      renderAmazonPair(ctxB, ctxA, size);
  }

  const before = ctxB.getImageData(0, 0, size, size);
  const after = ctxA.getImageData(0, 0, size, size);
  return { before, after };
}

/**
 * Amazon Deforestation Generator: Dense Rainforest -> Fishbone Clearings
 */
function renderAmazonPair(ctxB: CanvasRenderingContext2D, ctxA: CanvasRenderingContext2D, size: number) {
  // Background dense rainforest canopy for both
  for (const ctx of [ctxB, ctxA]) {
    ctx.fillStyle = '#1b4d24'; // Deep forest green
    ctx.fillRect(0, 0, size, size);

    // Natural canopy mottling and texture
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 4 + Math.random() * 18;
      const shade = Math.random() > 0.5 ? '#15411d' : '#23592c';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = shade;
      ctx.fill();
    }

    // Natural meandering river through the landscape
    ctx.beginPath();
    ctx.moveTo(0, size * 0.45);
    ctx.bezierCurveTo(size * 0.3, size * 0.38, size * 0.5, size * 0.62, size, size * 0.52);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#183838'; // Silt river
    ctx.stroke();

    // River tributaries
    ctx.beginPath();
    ctx.moveTo(size * 0.4, size * 0.45);
    ctx.quadraticCurveTo(size * 0.48, size * 0.2, size * 0.35, 0);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#183838';
    ctx.stroke();
  }

  // AFTER scene: Fishbone roads and clearcut pastures (ochre/tan/light soil)
  const pastureColors = ['#d4a373', '#ccd5ae', '#c89f68', '#b5835a', '#997b5a'];

  // Main access highway slicing through forest
  ctxA.beginPath();
  ctxA.moveTo(size * 0.1, 0);
  ctxA.lineTo(size * 0.85, size);
  ctxA.lineWidth = 6;
  ctxA.strokeStyle = '#b08968';
  ctxA.stroke();

  // Secondary fishbone roads branching off
  for (let step = 0.15; step < 0.9; step += 0.08) {
    const rx = size * (0.1 + step * 0.75);
    const ry = size * step;

    // Lateral branch left
    ctxA.beginPath();
    ctxA.moveTo(rx, ry);
    ctxA.lineTo(rx - size * 0.22, ry + size * 0.05);
    ctxA.lineWidth = 3;
    ctxA.strokeStyle = '#c59b75';
    ctxA.stroke();

    // Lateral branch right
    ctxA.beginPath();
    ctxA.moveTo(rx, ry);
    ctxA.lineTo(rx + size * 0.25, ry - size * 0.05);
    ctxA.lineWidth = 3;
    ctxA.strokeStyle = '#c59b75';
    ctxA.stroke();

    // Agricultural clearcuts along roads
    if (step > 0.25 && step < 0.8) {
      const pColor = pastureColors[Math.floor(Math.random() * pastureColors.length)];
      ctxA.fillStyle = pColor;

      // Cleared pasture rectangle 1
      ctxA.fillRect(rx - size * 0.18, ry - 12, size * 0.12, 28);

      // Cleared pasture rectangle 2
      ctxA.fillStyle = pastureColors[Math.floor(Math.random() * pastureColors.length)];
      ctxA.fillRect(rx + size * 0.06, ry - 18, size * 0.15, 34);
    }
  }

  // Large intensive clearing in North-East quadrant
  ctxA.fillStyle = '#b5835a';
  ctxA.fillRect(size * 0.58, size * 0.12, size * 0.32, size * 0.25);
  ctxA.fillStyle = '#c59b75';
  ctxA.fillRect(size * 0.62, size * 0.15, size * 0.24, size * 0.18);

  // Irregular logging patches
  for (let i = 0; i < 8; i++) {
    const px = size * 0.25 + Math.random() * (size * 0.5);
    const py = size * 0.55 + Math.random() * (size * 0.35);
    ctxA.fillStyle = pastureColors[i % pastureColors.length];
    ctxA.beginPath();
    ctxA.roundRect(px, py, 26 + Math.random() * 35, 20 + Math.random() * 30, 4);
    ctxA.fill();
  }
}

/**
 * Lake Mead Dendritic Reservoir Generator: Deep Near-Black Optical Water -> Receded Chalk Shoreline
 * Specifically generates dendritic branching forked canyon arms (Overton Arm & side bays)
 * which trigger shape-based tree/root hallucinations in uncalibrated VLMs.
 */
function renderLakeMeadPair(ctxB: CanvasRenderingContext2D, ctxA: CanvasRenderingContext2D, size: number) {
  // Arid Mojave desert canyon terrain base for both scenes
  for (const ctx of [ctxB, ctxA]) {
    ctx.fillStyle = '#9c7349'; // Mojave desert sandstone
    ctx.fillRect(0, 0, size, size);

    // Eroded canyon ridge strata
    for (let i = 0; i < 350; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.ellipse(x, y, 16 + Math.random() * 28, 4 + Math.random() * 10, Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? '#7f5833' : '#b28b63';
      ctx.fill();
    }
  }

  // Draw the intricate dendritic branching lake system
  function drawDendriticReservoir(ctx: CanvasRenderingContext2D, color: string, scale: number) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Central canyon spine
    ctx.beginPath();
    ctx.moveTo(size * 0.12, size * 0.85);
    ctx.bezierCurveTo(size * 0.28, size * 0.65, size * 0.38, size * 0.52, size * 0.52, size * 0.42);
    ctx.bezierCurveTo(size * 0.62, size * 0.35, size * 0.75, size * 0.28, size * 0.88, size * 0.15);
    ctx.lineWidth = 42 * scale;
    ctx.stroke();

    // 2. North-East Fork (Overton Arm - major dendritic branching tree)
    ctx.beginPath();
    ctx.moveTo(size * 0.50, size * 0.44);
    ctx.bezierCurveTo(size * 0.58, size * 0.32, size * 0.68, size * 0.22, size * 0.72, size * 0.08);
    ctx.lineWidth = 26 * scale;
    ctx.stroke();

    // Secondary dendritic fingers off Overton Arm
    ctx.beginPath();
    ctx.moveTo(size * 0.60, size * 0.30);
    ctx.lineTo(size * 0.75, size * 0.34);
    ctx.lineWidth = 14 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.66, size * 0.18);
    ctx.lineTo(size * 0.82, size * 0.14);
    ctx.lineWidth = 10 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.64, size * 0.24);
    ctx.lineTo(size * 0.54, size * 0.16);
    ctx.lineWidth = 9 * scale;
    ctx.stroke();

    // 3. Detrital Wash / South-West Forked Bay (dendritic fingers)
    ctx.beginPath();
    ctx.moveTo(size * 0.34, size * 0.58);
    ctx.bezierCurveTo(size * 0.22, size * 0.54, size * 0.16, size * 0.44, size * 0.06, size * 0.40);
    ctx.lineWidth = 22 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.22, size * 0.50);
    ctx.lineTo(size * 0.18, size * 0.32);
    ctx.lineWidth = 12 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.26, size * 0.52);
    ctx.lineTo(size * 0.32, size * 0.38);
    ctx.lineWidth = 10 * scale;
    ctx.stroke();

    // 4. Temple Basin side canyon
    ctx.beginPath();
    ctx.moveTo(size * 0.44, size * 0.48);
    ctx.bezierCurveTo(size * 0.42, size * 0.65, size * 0.52, size * 0.74, size * 0.60, size * 0.82);
    ctx.lineWidth = 18 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.50, size * 0.70);
    ctx.lineTo(size * 0.64, size * 0.68);
    ctx.lineWidth = 9 * scale;
    ctx.stroke();

    ctx.restore();
  }

  // BEFORE: Deep reservoir water. Near-black optical signature typical of remote sensing NIR absorption
  // High NDWI (+0.64) and negative NDVI (-0.19)
  drawDendriticReservoir(ctxB, '#0b233a', 1.0);
  // Shallow turquoise fringe
  drawDendriticReservoir(ctxB, '#12395b', 0.94);

  // AFTER: Drought Recession exposing chalk bathtub ring along branching perimeter
  // 1. Draw the former water footprint in chalk mineral sediment (bathtub ring #e6ded1)
  drawDendriticReservoir(ctxA, '#ebe1d3', 1.0);

  // 2. Draw dried mudflats in the upper dendritic branch tips (#cfbda8)
  drawDendriticReservoir(ctxA, '#cfbda8', 0.90);

  // 3. Draw receded inner water core (shrunken deep navy water, scale 0.62)
  drawDendriticReservoir(ctxA, '#0c2236', 0.62);
}

/**
 * SWED Sentinel-2 Water Edges Benchmark Generator
 * Multitemporal tidal estuary & lake edge with dendritic channels vs surrounding vegetation
 */
function renderSwedPair(ctxB: CanvasRenderingContext2D, ctxA: CanvasRenderingContext2D, size: number) {
  // Base marshland & coastal silt terrain
  for (const ctx of [ctxB, ctxA]) {
    ctx.fillStyle = '#3c6e47'; // Coastal vegetation & marsh
    ctx.fillRect(0, 0, size, size);

    // Agricultural plots and pasture boundary grid
    ctx.strokeStyle = '#4e855b';
    ctx.lineWidth = 2;
    for (let x = 0; x < size; x += 64) {
      ctx.strokeRect(x, 0, 64, size);
    }
  }

  // Draw tidal water estuary
  function drawEstuary(ctx: CanvasRenderingContext2D, waterColor: string, tideScale: number) {
    ctx.save();
    ctx.fillStyle = waterColor;
    ctx.strokeStyle = waterColor;
    ctx.lineCap = 'round';

    // Main estuary channel
    ctx.beginPath();
    ctx.moveTo(0, size * 0.2);
    ctx.bezierCurveTo(size * 0.3, size * 0.35, size * 0.45, size * 0.55, size * 0.85, size * 0.85);
    ctx.lineWidth = 55 * tideScale;
    ctx.stroke();

    // Dendritic tidal creeks branching into marsh
    ctx.beginPath();
    ctx.moveTo(size * 0.35, size * 0.42);
    ctx.quadraticCurveTo(size * 0.55, size * 0.25, size * 0.72, size * 0.18);
    ctx.lineWidth = 24 * tideScale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.52, size * 0.28);
    ctx.lineTo(size * 0.62, size * 0.10);
    ctx.lineWidth = 12 * tideScale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.44, size * 0.52);
    ctx.lineTo(size * 0.28, size * 0.72);
    ctx.lineWidth = 18 * tideScale;
    ctx.stroke();

    ctx.restore();
  }

  // BEFORE: High tide water level (deep water #0d324d)
  drawEstuary(ctxB, '#0e3856', 1.0);

  // AFTER: Low tide / water recession with exposed tidal silt mudflats (#8f8574)
  drawEstuary(ctxA, '#9e9482', 1.0); // Mudflat fringe
  drawEstuary(ctxA, '#103d5e', 0.68); // Narrowed low-tide channel
}

/**
 * Dubai Urban Expansion Generator: Empty Desert -> Highway Grid & Developments
 */
function renderUrbanPair(ctxB: CanvasRenderingContext2D, ctxA: CanvasRenderingContext2D, size: number) {
  // Arid sandy desert base
  for (const ctx of [ctxB, ctxA]) {
    ctx.fillStyle = '#d9b382'; // Warm desert sand
    ctx.fillRect(0, 0, size, size);

    // Wind dune ripples
    for (let y = 0; y < size; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(size * 0.5, y + 8, size, y);
      ctx.strokeStyle = '#cfa774';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Coastal coastline on left edge
    ctx.fillStyle = '#1c7293';
    ctx.fillRect(0, 0, size * 0.22, size);
    ctx.strokeStyle = '#99d98c';
    ctx.lineWidth = 4;
    ctx.strokeRect(size * 0.21, 0, 4, size);
  }

  // BEFORE: Only a simple sparse single coastal road
  ctxB.beginPath();
  ctxB.moveTo(size * 0.24, 0);
  ctxB.lineTo(size * 0.24, size);
  ctxB.strokeStyle = '#7f7f7f';
  ctxB.lineWidth = 3;
  ctxB.stroke();

  // AFTER: Major arterial highway network, urban developments, building roofs, green turf
  // Main highway
  ctxA.beginPath();
  ctxA.moveTo(size * 0.24, 0);
  ctxA.lineTo(size * 0.24, size);
  ctxA.strokeStyle = '#333333';
  ctxA.lineWidth = 8;
  ctxA.stroke();

  // Intersecting expressway
  ctxA.beginPath();
  ctxA.moveTo(size * 0.2, size * 0.45);
  ctxA.lineTo(size, size * 0.45);
  ctxA.strokeStyle = '#333333';
  ctxA.lineWidth = 7;
  ctxA.stroke();

  // Ring road
  ctxA.beginPath();
  ctxA.arc(size * 0.6, size * 0.5, size * 0.28, 0, Math.PI * 2);
  ctxA.strokeStyle = '#444444';
  ctxA.lineWidth = 5;
  ctxA.stroke();

  // Urban block subdivisions (asphalt & bright roof clusters)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const bx = size * 0.35 + col * 38;
      const by = size * 0.15 + row * 34;
      ctxA.fillStyle = '#f0f0f0'; // High albedo building roof
      ctxA.fillRect(bx, by, 22, 18);
      ctxA.strokeStyle = '#555555';
      ctxA.strokeRect(bx, by, 22, 18);
    }
  }

  // Irrigated green oasis / golf course fairway in desert
  ctxA.fillStyle = '#2d6a4f';
  ctxA.beginPath();
  ctxA.ellipse(size * 0.72, size * 0.75, 45, 28, Math.PI / 6, 0, Math.PI * 2);
  ctxA.fill();

  ctxA.beginPath();
  ctxA.ellipse(size * 0.82, size * 0.68, 30, 20, -Math.PI / 4, 0, Math.PI * 2);
  ctxA.fill();

  // Artificial dredged canal inland
  ctxA.fillStyle = '#1c7293';
  ctxA.fillRect(size * 0.22, size * 0.68, size * 0.25, 14);
}

/**
 * Sierra Wildfire Burn Scar Generator: Conifer Canopy -> Dark Ash Burn Scar
 */
function renderWildfirePair(ctxB: CanvasRenderingContext2D, ctxA: CanvasRenderingContext2D, size: number) {
  // Mountain terrain with deep conifer forest for BEFORE
  ctxB.fillStyle = '#1e3f20'; // Pine green
  ctxB.fillRect(0, 0, size, size);

  // Mountain ridges texture
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctxB.fillStyle = Math.random() > 0.5 ? '#152e17' : '#274f2a';
    ctxB.beginPath();
    ctxB.arc(x, y, 3 + Math.random() * 12, 0, Math.PI * 2);
    ctxB.fill();
  }

  // Alpine rocky ridges
  ctxB.beginPath();
  ctxB.moveTo(size * 0.1, size * 0.85);
  ctxB.lineTo(size * 0.5, size * 0.3);
  ctxB.lineTo(size * 0.9, size * 0.1);
  ctxB.lineWidth = 10;
  ctxB.strokeStyle = '#5e655a';
  ctxB.stroke();

  // Clone terrain to AFTER first
  ctxA.drawImage(ctxB.canvas, 0, 0);

  // Massive dark charcoal burn scar on AFTER scene
  ctxA.save();
  ctxA.beginPath();
  ctxA.moveTo(size * 0.28, size * 0.2);
  ctxA.bezierCurveTo(size * 0.65, size * 0.15, size * 0.85, size * 0.45, size * 0.75, size * 0.8);
  ctxA.bezierCurveTo(size * 0.6, size * 0.95, size * 0.35, size * 0.85, size * 0.25, size * 0.65);
  ctxA.bezierCurveTo(size * 0.15, size * 0.45, size * 0.2, size * 0.3, size * 0.28, size * 0.2);
  ctxA.closePath();

  // Dark scorched charcoal gradient
  const grad = ctxA.createRadialGradient(size * 0.5, size * 0.5, 20, size * 0.5, size * 0.5, size * 0.4);
  grad.addColorStop(0, '#261b17'); // Dark ash/charcoal
  grad.addColorStop(0.6, '#3a271f'); // Scorched timber
  grad.addColorStop(1, '#54382c'); // Singed perimeter
  ctxA.fillStyle = grad;
  ctxA.fill();

  // Scorched soil textures
  for (let i = 0; i < 300; i++) {
    const rx = size * 0.28 + Math.random() * (size * 0.48);
    const ry = size * 0.25 + Math.random() * (size * 0.52);
    ctxA.fillStyle = Math.random() > 0.5 ? '#1a1210' : '#452d21';
    ctxA.fillRect(rx, ry, 6 + Math.random() * 14, 4 + Math.random() * 8);
  }

  // Small unburned green island / refugia in the center
  ctxA.beginPath();
  ctxA.arc(size * 0.48, size * 0.52, 18, 0, Math.PI * 2);
  ctxA.fillStyle = '#214223';
  ctxA.fill();

  ctxA.restore();
}

/**
 * Load and resize user uploaded image file to matching dimensions (size x size)
 */
export async function loadImageFromFile(file: File, size = 512): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Draw centered and cover
        const scale = Math.max(size / img.width, size / img.height);
        const nw = img.width * scale;
        const nh = img.height * scale;
        const ox = (size - nw) / 2;
        const oy = (size - nh) / 2;
        ctx.drawImage(img, ox, oy, nw, nh);
        resolve(ctx.getImageData(0, 0, size, size));
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
