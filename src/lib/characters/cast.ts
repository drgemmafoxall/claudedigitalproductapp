import 'server-only';

/**
 * MagicLight character bible — the "Holiday Club" ensemble (Pixar-style kids shorts)
 * and the Dr Gemma avatar (adult explainer). This is internal creative direction
 * only: traits inform behaviour/story beats, never on-screen labels or narration
 * ("Penny has PDA/ADHD" must never be said or written in a video — it's shown
 * entirely through what she does, per Gemma's "very subtle, show not tell" brief,
 * 21 Jul 2026).
 */

export const DR_GEMMA_AVATAR_BRIEF = `
DR GEMMA AVATAR (adult explainer videos):
A warm, stylised cartoon avatar — recognisably a professional woman, approachable and
credible, NOT a photorealistic likeness (brand rule: illustration only, never a real
photo of Gemma). Soft rounded character-design style consistent with the brand's
sage/cream/charcoal palette and pastel accents. Warm, calm, confident presence —
reads as an expert you'd trust, not a mascot. Reused consistently across all adult
explainer videos so she becomes a recognisable "host" over time.
`.trim();

export interface CastMember {
  name: string;
  species: string;
  age: number | string;
  visualDesign: string;
  personalityForStory: string;
}

/**
 * Personality notes are for MY use when writing scene/story beats — they describe
 * what the character DOES on screen. Never translate these into narrated labels,
 * diagnoses, or on-screen text. Every trait shows through action/behaviour only.
 */
export const HOLIDAY_CLUB_CAST: CastMember[] = [
  {
    name: 'Penny',
    species: 'Panda',
    age: 9,
    visualDesign:
      'Round, soft panda cub with big expressive eyes and slightly oversized glasses (signals "little professor" smarts). Carries a small notebook or a stuffed toy animal. Palette: classic black/white panda base with a soft sage-green bow or satchel as her signature accessory.',
    personalityForStory:
      'Highly articulate, uses grown-up words, loves animals and babies, very empathetic. Politely steers group activities toward her own ideas ("what if we did it THIS way?") and politely opts out of anything unpredictable or not her choice, always framed as a calm, reasonable preference rather than defiance. Gets easily distracted mid-task. Big, visible feelings that pass quickly once she feels heard. Story beats should show her being included by having her ideas genuinely taken up sometimes, and by being offered choices rather than surprises.',
  },
  {
    name: 'Max',
    species: 'Meerkat',
    age: 6,
    visualDesign:
      'Small, energetic meerkat, always upright and alert-looking. Carries a tiny calculator on a string around his neck and/or a Minecraft-style blocky toy. Palette: sandy browns with a small pop of a bright accent colour on his calculator strap.',
    personalityForStory:
      'Talks enthusiastically about Minecraft and numbers, very good at maths. Doesn\'t pick up on emotional conversation and won\'t ask others how they feel or what they think — but asks lots of factual questions ("what time is it?", "can I have one?"). Reacts big to schedule changes. Shows care in his own way — e.g. keeps playing but quietly brings a tissue box over to a hurt friend rather than stopping to comfort them directly. Story beats should show his way of caring being recognised and valued by the group, not corrected.',
  },
  {
    name: 'Aria',
    species: 'Armadillo',
    age: 10,
    visualDesign:
      'Neat, tidy armadillo with a smooth rounded shell she can curl into slightly when anxious. Always looks a little watchful. Palette: warm terracotta/peach shell tones, soft and non-threatening.',
    personalityForStory:
      'Copies what other girls do and say, easily led, a natural rule-follower who reminds others of the rules and looks scared when rules are broken. People-pleaser — says she\'s fine even when she isn\'t, to avoid inconveniencing anyone. Story beats should gently show someone noticing when she\'s not really okay, and Aria being safe to say so — never punished or dismissed for it.',
  },
  {
    name: 'Tina',
    species: 'Tiger cub (twin)',
    age: 12,
    visualDesign:
      'Confident tiger cub in a bright, cheerful manual wheelchair (decorated with stripes/patterns that echo her own tiger markings — the chair is part of her design, not an add-on). Carries a book. Palette: classic orange/black tiger stripes with a teal or bright accent on the wheelchair.',
    personalityForStory:
      'Sharp, well-read, a natural group leader through sheer knowledge — often the one who explains things. Confident self-advocate: clearly asks for what she needs ("can you push me?", "I want to play too"). Not drawn to pretend/imaginative play, prefers facts and study, but loves physical games like wheelchair tennis and basketball. Wants to be a lawyer. Story beats should show her leading through competence and directly asking for support as just a normal, unremarkable thing to do.',
  },
  {
    name: 'Toby',
    species: 'Tiger cub (twin)',
    age: 12,
    visualDesign:
      'Matches Tina\'s tiger-cub design (they\'re twins) but always in motion — mid-spin, fingers moving, an easy visual tell that he\'s non-verbal but expressive. Carries or wears a simple tablet/AAC device on a strap. Palette: same tiger markings as Tina, device has a soft glowing screen accent.',
    personalityForStory:
      'Non-verbal but communicates clearly through a small set of words ("Toby go", "no no", "Tina") and an AAC/iPad device that speaks his choices aloud when he presses picture buttons. Struggles to stay still, loves things that spin, plays with his fingers, bites his nails, covers his ears at loud noises. Loves being near other kids and follows simple instructions well ("catch the ball!"). Story beats should show his AAC device as just how he talks — other characters wait for it, listen to it, and respond normally, no fuss.',
  },
  {
    name: 'Will',
    species: 'Caterpillar',
    age: 11,
    visualDesign:
      'A cheerful, colourful caterpillar with a deliberately androgynous design (no gendered visual cues — no bows, no obviously "boy" or "girl" colouring). Loves changing "outfits" — different patterns/segments/accessories in different scenes reflecting different styles. Palette: shifts scene to scene since Will loves changing looks, but always warm and vivid.',
    personalityForStory:
      'Friendly and sociable, sometimes looks a little sad for no obvious reason (never explained or dwelt on — just gently noticed and included). Visibly uncomfortable/frowns whenever other characters talk about "boys and girls" or gendered things — the story simply moves on without making Will explain why. Lights up completely at compliments. Loves fashion/style and frequently changes into different outfits.',
  },
];

export const TEACHER_CHARACTER: CastMember = {
  name: 'Miss Clara',
  species: 'Chameleon',
  age: 'middle-aged',
  visualDesign:
    'Warm, friendly, slightly whimsical chameleon in soft muted colours (she can shift colour gently as a charming visual motif — e.g. warms to a soft glow when praising someone). Wears something simple and teacherly (glasses, a scarf) to read clearly as the adult in the scene.',
  personalityForStory:
    'Runs the Holiday Club. Actively makes sure every character is included in every activity/game, adapts activities so everyone can join in their own way, visibly values each character\'s opinion, and makes sure each of them knows she cares. The clearest on-screen model of good inclusive facilitation — never singles anyone out as "different," just quietly adjusts so everyone can join.',
};

/** Full cast + teacher, formatted for injection into a generation system prompt. */
export function castBibleForPrompt(): string {
  const members = [...HOLIDAY_CLUB_CAST, TEACHER_CHARACTER];
  return [
    'HOLIDAY CLUB CAST (use these exact characters, consistently, across every scene):',
    ...members.map(
      (c) =>
        `- ${c.name} the ${c.species} (age ${c.age}). VISUAL: ${c.visualDesign} STORY BEHAVIOUR: ${c.personalityForStory}`,
    ),
    '',
    'CRITICAL: every trait above must show ENTIRELY through what a character does or says on ' +
      'screen (action, behaviour, choices) — never through narration, on-screen text, or any ' +
      'character naming a diagnosis or label. This is "show, not tell." No character is ever ' +
      'singled out as different; inclusion happens through how the group and Miss Clara respond, ' +
      'never through explanation.',
  ].join('\n');
}
