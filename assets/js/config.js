/* Configuracion base de la aplicacion.
   Aqui se centralizan los rangos, constantes y ponderaciones del modelo. */
const NUM_MAX = 43;
const SUPER_MAX = 16;
const PICK_COUNT = 5;
const LAMBDA = 1;
const DECAY = 0.93;
const ITER = 1800;
const STORAGE_REALES = "reales";
const STORAGE_HISTORY = "history";

const baseFreq = buildBaseFreq(NUM_MAX);
const baseSuperFreq = buildBaseFreq(SUPER_MAX);

function buildBaseFreq(max){
  const freq = {};
  for(let i = 1; i <= max; i++) freq[i] = 1;
  return freq;
}
