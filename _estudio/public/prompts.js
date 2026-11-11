// Textos dos pedidos à IA e categorias de foto do Estúdio Veicular.
// Usado pela tela (public/index.html) e pelo modo automático (scripts/estudio-fotos.py, via _estudio/textos.mjs).
// Mude os textos só aqui: os dois usam este mesmo arquivo.

const AUTO_PRESET = 'Automático pelo tom do carro';
const PRESETS = {
  'Concreto médio': 'a medium gray studio with a seamless backdrop of softly mottled concrete texture in a medium gray tone, a little lighter behind the vehicle and only gently darker toward the edges, and a polished gray concrete floor with soft, natural reflections of the vehicle and gentle diffuse pools of light. The overall scene is bright and airy, lit by bright, soft, even, diffuse light, never dark or moody',
  'Concreto claro': 'a light gray studio with a seamless backdrop of softly mottled light concrete texture, and a polished light gray concrete floor with soft, natural reflections of the vehicle, lit by bright, soft, even, diffuse light',
  'Fundo branco infinito': 'a seamless white cyclorama: a smooth white wall that curves into a light gray, matte, slightly reflective floor with no visible seam or corner, lit by soft, even, diffuse light',
  'Cinza escuro': 'a seamless dark charcoal cyclorama with a subtly reflective dark floor, lit softly and evenly',
  'Showroom claro': 'a minimal bright showroom with a light concrete floor and plain matte walls, lit by soft, even daylight',
};

// Vale para todo cenário: as luzes ficam fora do quadro.
const NO_FIXTURES = 'The light comes from outside the frame: no light fixtures, softboxes, light panels, lamps, strip lights, rigging or ceiling structures may appear anywhere in the image. Reflections on the paint and chrome are soft gradients, never the shapes of lamps or panels. If the ceiling is in frame, it is a plain, smooth surface that matches the walls.';

// Carro claro ou médio vai para o concreto médio; carro escuro sumiria nele e vai para o claro.


// group: as referências só vêm de fotos do mesmo grupo. ai: false = só ajuste local grátis.
const CATEGORIES = {
  exterior: { label: 'Exterior completo', group: 'exterior', ai: true, studioRef: true },
  exterior_detail: { label: 'Exterior detalhe', group: 'exterior', ai: true, studioRef: true },
  open_cabin: { label: 'Cabine aberta', group: 'interior', ai: true, studioRef: true },
  interior_detail: { label: 'Interior detalhe', group: 'interior', ai: true, studioRef: true },
  engine: { label: 'Motor', group: 'engine', ai: true },
  underside: { label: 'Chassi / embaixo (sem IA)', group: 'underside', ai: false },
};

const ANGLE_ORDER = ['front', 'front_right', 'right', 'rear_right', 'rear', 'rear_left', 'left', 'front_left'];

const NO_MIRROR = 'Do not mirror or flip the image: the vehicle must face exactly the same direction as in IMAGE 1.';

const KEEP_VEHICLE = `Preserve exactly: shape, proportions, paint color and finish, every paint chip, patina, rust, stain, scratch, dent and sign of wear, all numbers, lettering, decals, badges, license plate, wheels, tires, chrome and trim. Do not repair, clean, repaint, restore or redesign anything. ${NO_MIRROR}

Vehicle features that must stay exactly as they are: {NOTAS}.`;

// Sem isto a IA mantinha a luz do dia da foto original e o carro parecia colado no fundo.
// Nos closes a IA mexia pouco e mantinha os pontos de brilho do sol; por isso o pedido é explícito.
const NO_GLARE = 'Replace every sunlight glare on glossy surfaces, such as paint, lacquered wood, chrome, plastic and glass: bright white streaks, hot spots, sparkles and blown-out highlights must become soft, broad, low-contrast studio reflections. Mirrors, windows and every reflective surface must reflect only the studio: no trace of the original street, fence, buildings, sky, trees or people may remain in any reflection. Keep colors natural, without oversaturation.';

// Em closes a IA tendia a trocar só o fundo e copiar o resto da foto como estava.
const CLOSE_UP_RELIGHT = 'Even though this is a close-up, do not copy the original pixels and lighting: re-render every surface of IMAGE 1 under the studio light, keeping only its physical shape, materials, colors and wear.';

const RELIGHT = `Relight the vehicle so it truly belongs in this studio, as if it had been photographed there: match the studio's exposure, contrast, color temperature and soft light direction. Remove outdoor sunlight, harsh sun highlights, and reflections of the sky, trees, buildings and street from the paint, chrome and glass. Add soft studio highlights with gentle falloff, and correct white balance and color so the paint shows its true color under neutral studio light. The vehicle and the floor must share the same light and shadows. The vehicle must stay well exposed and bright, clearly lit by the studio light, with visible detail in its darker areas; never darken it to match the background. ${NO_GLARE} Preserving the vehicle means keeping its physical features, not its original lighting.`;

const RELIGHT_INTERIOR = `Relight the interior with soft, even studio light that matches the studio: bright, well-exposed, with visible detail in dark areas, neutral white balance and natural colors, without harsh sunlight patches or hard shadows. ${NO_GLARE} Preserving the interior means keeping its physical features, not its original lighting.`;

const PROMPTS = {
  exterior: `Edit IMAGE 1, a real photo of a vehicle, and place the vehicle in a professional photo studio.

Studio: {ESTUDIO}. ${NO_FIXTURES}

${KEEP_VEHICLE} Keep the camera angle, perspective and framing.

Remove the old ground, background, sun shadows and the photographer's shadow. Add a soft, realistic studio contact shadow under the tires. Chrome, paint and glass should reflect the studio instead of the old surroundings, without changing their shape. Replace everything visible through the windshield and windows with the studio.

${RELIGHT}

If part of the vehicle is outside the frame, keep it outside the frame. No text, logos, people or extra objects.`,

  exterior_detail: `Edit IMAGE 1, a real close-up photo of part of a vehicle's exterior.

Studio: {ESTUDIO}. ${NO_FIXTURES}

${KEEP_VEHICLE} Keep the exact crop, camera angle and framing. Do not show more of the vehicle than IMAGE 1 shows.

Replace the visible background, the ground and everything seen through the glass with the studio, remove sun shadows and the photographer's shadow, and add a soft studio shadow where the vehicle meets the floor. Chrome and paint should reflect the studio without changing shape.

${RELIGHT} ${CLOSE_UP_RELIGHT} No text, logos, people or extra objects.`,

  open_cabin: `Edit IMAGE 1, a real photo of a vehicle's cabin seen from outside, from above, through an open door or over an open top.

Studio: {ESTUDIO}. ${NO_FIXTURES}

${KEEP_VEHICLE} Also keep every seat, control, gauge, material, stain and sign of wear in the cabin, and keep the camera angle and framing.

Replace all outdoor surroundings visible around the vehicle, through the windshield, windows and open doors with the studio. Remove the photographer's shadow.

${RELIGHT} ${RELIGHT_INTERIOR} ${CLOSE_UP_RELIGHT} No text, logos or extra objects.`,

  interior_detail: `Edit IMAGE 1, a real close-up photo of a vehicle interior, and make it look photographed inside a professional photo studio.

Studio: {ESTUDIO}. ${NO_FIXTURES}

Keep everything exactly as it is: camera angle, framing, every seat, control, gauge, needle position, material, texture, stain and sign of wear. Do not repair, clean, restore or redesign anything. ${NO_MIRROR}

Vehicle features that must stay exactly as they are: {NOTAS}.

Replace everything visible outside the vehicle, through the windshield, windows and open doors, with the studio, so no street, buildings, sky, grass or other vehicles remain.

${RELIGHT_INTERIOR} ${CLOSE_UP_RELIGHT} No text or extra objects.`,

  engine: `Edit IMAGE 1, a real photo of a vehicle's engine bay.

Keep every part exactly as it is: engine, carburetors, wires, hoses, clamps, labels, paint, chrome, dirt, grime, rust and wear, in the same position and shape. Do not add, remove, clean, repair or redesign anything. ${NO_MIRROR}

Vehicle features that must stay exactly as they are: {NOTAS}.

Only improve the photo: balanced exposure, neutral white balance, natural colors and soft even light that shows details in dark areas. No text or extra objects.`,

  // Só usada quando a foto de chassi tem marca d'água ou propaganda e a remoção está ligada.
  underside: `Edit IMAGE 1, a real photo taken underneath a vehicle.

Change nothing about the vehicle or the surroundings: keep every part, rust, dirt, stain, the lift and the camera angle exactly as they are. Do not clean, repair or relight anything.

Only remove watermarks, logos, timestamps or text overlaid on the photo, and any dealer or workshop advertising that is not part of the vehicle, filling those areas naturally with what should be underneath.`,
};

const REMOVE_MARKS = `Also remove anything that is not part of the vehicle: watermarks, logos, timestamps or text overlaid on the photo, and dealer or workshop advertising such as promotional plates, plate frames, stickers or signs with a business name or logo. Fill those areas naturally with what should be underneath. Keep everything that belongs to the vehicle: manufacturer emblems and badges, model lettering, the vehicle's own painted numbers and decals, and the official license plate.`;

// Instruções de remoção vão só para fotos em que a classificação apontou o problema:
// mandá-las em todas as fotos fazia o Google bloquear muitas imagens (IMAGE_SAFETY).
const REMOVE_PERSON = 'There is part of a person, such as a foot, leg or hand, at the edge of IMAGE 1. Remove it and fill that area naturally with the matching surface of the scene.';
const PERSON_ISSUE = /pessoa|corpo/i;
const MARK_ISSUE = /marca d.água|propaganda/i;

// Frases acrescentadas ao pedido quando vão fotos de referência ({N} = número da última imagem de referência).
const NEIGHBOR_NOTE = 'IMAGES 2 to {N} show other photos of this same vehicle. Use them only to keep details accurate. Do not copy their camera angle or framing.';
const STUDIO_REF_NOTE = 'The last image shows the target studio. Match its walls, floor and soft lighting, but do not copy any light fixtures, softboxes or panels visible in it, and ignore any vehicle in it.';
