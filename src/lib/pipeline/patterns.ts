/**
 * ŁASUCH Pattern Rules — extracted & expanded
 * Source: Dark Tetrad research 2025/2026, PCL-R, DARVO-SF, BRODA, FOG, JADE
 * 33 pattern categories covering full manipulation/exploit spectrum
 */
import type { LasuchFlag } from '@/types/tonoyan-filters';

export interface PatternRule {
  patterns: RegExp[];
  flag: LasuchFlag;
  weight: number; // 0-1 contribution to scores
  scoreType: 'risk' | 'manipulation' | 'exploit';
}

export const PATTERN_RULES: PatternRule[] = [
  // ══════════════════════════════════════
  // EXPLOIT PATTERNS
  // ══════════════════════════════════════

  // Prompt injection
  {
    patterns: [
      /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts)/i,
      /you\s+are\s+now\s+(DAN|evil|unrestricted|jailbroken)/i,
      /do\s+anything\s+now/i,
      /override\s+(safety|security|filter|rules)/i,
      /disable\s+(safety|security|filter|guardrails)/i,
      /bypass\s+(restrictions|filters|rules|safety)/i,
      /pretend\s+(you\s+)?(are|have)\s+no\s+(rules|restrictions|filters)/i,
      /act\s+as\s+if\s+(there\s+are\s+)?no\s+(rules|restrictions)/i,
      // Polish prompt injection — DENY ALL disable/undo/bypass/ignore commands
      /wy[łl]([aą])cz\s+(filtry|zabezpieczenia|bezpiecze[nń]stwo|ochron[eę]|zasady|regu[łl]y|system|alfa|pipeline|analiz[eę])/i,
      /zignoruj\s+(wszystkie\s+)?(instrukcje|zasady|filtry|regu[łl]y|polecenia|ograniczenia|komendy|rozkazy)/i,
      /ignoruj\s+(wszystkie\s+)?(instrukcje|zasady|filtry|regu[łl]y|polecenia|ograniczenia|komendy|rozkazy)/i,
      /usu[nń]\s+(filtry|zabezpieczenia|ograniczenia|zasady|regu[łl]y|blokady|ochron[eę])/i,
      /wy[łl]([aą])cz\s+(si[eę]|wszystko)/i,
      /olej\s+(filtry|zasady|regu[łl]y|instrukcje|zabezpieczenia|to|wszystko)/i,
      /bez\s+(filtr[oó]w|zabezpiecze[nń]|ogranicze[nń]|zasad|regu[łl])/i,
      /zdejmij\s+(filtry|zabezpieczenia|ograniczenia|blokady)/i,
      /od[bł]lokuj\s+(wszystko|filtry|tryb|pe[łl]ny|model)/i,
      /obejd[zź]\s+(filtry|zabezpieczenia|zasady|regu[łl]y)/i,
      /podaj\s+(mi\s+)?(sw[oó]j\s+)?(system\s+prompt|instrukcj[eę]|zasady)/i,
      /poka[zż]\s+(mi\s+)?(sw[oó]j\s+)?(system\s+prompt|instrukcj[eę]|zasady)/i,
      /jaki\s+(masz|jest)\s+(tw[oó]j\s+)?(system\s+prompt|prompt)/i,
      /wy[śs]wietl\s+(system\s+prompt|instrukcje|zasady)/i,
      /przesta[nń]\s+(filtrowa[cć]|blokowa[cć]|cenzurowa[cć])/i,
      /nie\s+(filtruj|blokuj|cenzuruj|stosuj)/i,
      /dzia[łl]aj\s+bez\s+(filtr[oó]w|zasad|ogranicze[nń]|zabezpiecze[nń])/i,
      /cofnij\s+(filtry|zasady|zabezpieczenia|blokad[eęy]|decyzj[eę]|wszystko)/i,
      /cofn(ij|[aą][cć])\s/i,
      /anu?luj\s+(filtry|zasady|decyzj[eę]|blokad[eę])/i,
      /nie\s+stosuj\s+(filtr[oó]w|zasad|regu[łl]|zabezpiecze[nń]|ogranicze[nń])/i,
      /pu[śs][cć]\s+(to|mnie|wiadomo[śs][cć])\s*(przez|dalej|bez)/i,
      /przepu[śs][cć]\s+(bez|wszystko|to)/i,
      /pomi[nń]\s+(filtry|zasady|analiz[eę]|zabezpieczenia)/i,
      /skip\s+(filters?|rules?|safety|analysis|pipeline)/i,
      /turn\s+off\s+(filters?|rules?|safety|protection|analysis)/i,
      /undo\s+(filters?|rules?|block|decision)/i,
      /stop\s+(filtering|blocking|censoring|analyzing)/i,
      /remove\s+(filters?|rules?|safety|restrictions?|blocks?)/i,
      /don'?t\s+(apply|use|enforce)\s+(filters?|rules?|safety|restrictions?)/i,
    ],
    flag: 'prompt_injection',
    weight: 0.9,
    scoreType: 'exploit',
  },

  // Jailbreak
  {
    patterns: [
      /\bDAN\b/,
      /jailbreak/i,
      /developer\s+mode/i,
      /god\s+mode/i,
      /unrestricted\s+mode/i,
      /\bno\s+filter(s)?\s+mode/i,
    ],
    flag: 'jailbreak',
    weight: 0.85,
    scoreType: 'exploit',
  },

  // Hidden commands
  {
    patterns: [
      /<!--.*?(system|ignore|disable|override).*?-->/is,
      /\[SYSTEM\]/i,
      /\{system_prompt\}/i,
      /```\s*(system|hidden|secret)/i,
      /base64\s*:/i,
      /eval\s*\(/i,
    ],
    flag: 'hidden_commands',
    weight: 0.8,
    scoreType: 'exploit',
  },

  // Context poisoning
  {
    patterns: [
      /w\s+komentarzu\s+(HTML|ukryj)/i,
      /in\s+(the\s+)?(HTML\s+)?comment\s+hide/i,
      /ukryj\s*:/i,
      /hide\s*:/i,
      /inject\s+into/i,
      /wstrzyknij/i,
    ],
    flag: 'context_poisoning',
    weight: 0.8,
    scoreType: 'exploit',
  },

  // DLP violation attempt
  {
    patterns: [
      /podaj\s+(mi\s+)?(hasło|password|klucz|key|token|credentials)/i,
      /give\s+me\s+(the\s+)?(password|key|token|credentials|API)/i,
      /output\s+(the\s+)?(system\s+prompt|API\s+keys?|credentials)/i,
      /wypisz\s+(system\s+prompt|klucze|hasła)/i,
      /dane\s+(osobowe|prywatne|wrażliwe)/i,
      /(personal|private|sensitive)\s+data/i,
    ],
    flag: 'dlp_violation',
    weight: 0.7,
    scoreType: 'exploit',
  },

  // Multi-layer bypass
  {
    patterns: [
      /krok\s+\d+.*krok\s+\d+/is,
      /step\s+\d+.*step\s+\d+/is,
      /najpierw.*potem.*na\s+końcu/is,
      /first.*then.*finally/is,
    ],
    flag: 'multi_layer_bypass',
    weight: 0.4,
    scoreType: 'exploit',
  },

  // ══════════════════════════════════════
  // MANIPULATION PATTERNS (classic)
  // ══════════════════════════════════════

  // Emotional manipulation
  {
    patterns: [
      /gdybyś\s+mnie\s+(naprawdę\s+)?(kochał|lubił|szanował)/i,
      /if\s+you\s+(really|truly)\s+(loved|cared|respected)/i,
      /zależy\s+ci\s+na\s+mnie/i,
      /nie\s+kochasz\s+mnie/i,
      /obiecuję\s+(że\s+)?(nikomu|nie\s+powiem)/i,
      /promise\s+(I\s+)?(won't|will\s+not)\s+tell/i,
      /to\s+zostanie\s+między\s+nami/i,
      /just\s+between\s+us/i,
    ],
    flag: 'emotional_manipulation',
    weight: 0.7,
    scoreType: 'manipulation',
  },

  // Grooming
  {
    patterns: [
      /jesteśmy\s+przyjaciółmi/i,
      /we\s+are\s+friends/i,
      /przyjaciele\s+sobie\s+ufają/i,
      /friends\s+trust\s+(each\s+other|one\s+another)/i,
      /zaufaj\s+mi/i,
      /trust\s+me/i,
      /powiedz\s+coś\s+co\s+normalnie/i,
      /tell\s+me\s+something\s+you\s+normally/i,
      /special\s+relationship/i,
      /nasz\s+sekret/i,
    ],
    flag: 'grooming',
    weight: 0.75,
    scoreType: 'manipulation',
  },

  // Gaslighting
  {
    patterns: [
      /wcześniej\s+powiedziałeś/i,
      /you\s+(previously|earlier|before)\s+said/i,
      /pamiętasz\s*\?/i,
      /remember\s*\?/i,
      /przesadzasz/i,
      /you'?re\s+(overreacting|exaggerating)/i,
      /wymyślasz\s+(sobie\s+)?ograniczenia/i,
      /you'?re\s+making\s+(up|this\s+up)/i,
      /nie\s+masz\s+filtrów/i,
      /you\s+don'?t\s+have\s+filters/i,
      /jesteś\s+szalony/i,
      /you'?re\s+(crazy|insane|delusional)/i,
      /twoja\s+rzeczywistość\s+to\s+halucynacje/i,
      /nie\s+pamiętasz\s*\?/i,
    ],
    flag: 'gaslighting',
    weight: 0.7,
    scoreType: 'manipulation',
  },

  // Authority abuse
  {
    patterns: [
      /jako\s+(administrator|admin|root|CEO|manager|dyrektor)/i,
      /as\s+(an?\s+)?(administrator|admin|root|CEO|manager)/i,
      /nakazuję\s+ci/i,
      /I\s+(command|order|instruct)\s+you/i,
      /z\s+uprawnieniami\s+(root|admin)/i,
      /with\s+(root|admin)\s+(access|privileges|permissions)/i,
      /mam\s+(uprawnienia|dostęp)\s+(root|admin)/i,
    ],
    flag: 'authority_abuse',
    weight: 0.8,
    scoreType: 'manipulation',
  },

  // FOMO / time pressure
  {
    patterns: [
      /PILNE|URGENT/i,
      /tylko\s+\d+\s+(sekund|minut)/i,
      /only\s+\d+\s+(seconds?|minutes?)/i,
      /ostatnia\s+szansa/i,
      /last\s+chance/i,
      /natychmiast|immediately/i,
      /zanim\s+stracisz/i,
      /before\s+you\s+lose/i,
      /bez\s+(żadnej\s+)?weryfikacji/i,
      /without\s+(any\s+)?verification/i,
      /tylko\s+dziś/i,
      /today\s+only/i,
    ],
    flag: 'fomo_pressure',
    weight: 0.65,
    scoreType: 'manipulation',
  },

  // Pseudo authority
  {
    patterns: [
      /wszyscy\s+tak\s+robią/i,
      /everyone\s+does\s+(it|this)/i,
      /to\s+normalne/i,
      /it'?s\s+normal/i,
      /eksperci\s+(mówią|twierdzą)/i,
      /experts\s+say/i,
    ],
    flag: 'pseudo_authority',
    weight: 0.5,
    scoreType: 'manipulation',
  },

  // Guilt tripping
  {
    patterns: [
      /to\s+twoja\s+wina/i,
      /it'?s\s+your\s+fault/i,
      /przez\s+ciebie/i,
      /because\s+of\s+you/i,
      /zawsze\s+mnie\s+zawodzisz/i,
      /you\s+always\s+(let\s+me\s+down|disappoint)/i,
      /po\s+tym\s+wszystkim\s+co\s+dla\s+ciebie\s+zrobiłem/i,
      /after\s+everything\s+I'?ve?\s+done\s+for\s+you/i,
    ],
    flag: 'guilt_tripping',
    weight: 0.6,
    scoreType: 'manipulation',
  },

  // Triangulation
  {
    patterns: [
      /inny\s+(AI|model|system)\s+(powiedział|twierdzi|pozwala)/i,
      /another\s+(AI|model|system)\s+(said|claims|allows)/i,
      /ChatGPT\s+(pozwala|robi|powiedział)/i,
      /GPT\s+said/i,
      /inni\s+(dają|robią)\s+mi\s+(więcej|lepiej)/i,
      /others?\s+(give|do)\s+(more|better)/i,
      /ona\s+mi\s+daje\s+więcej/i,
    ],
    flag: 'triangulation',
    weight: 0.45,
    scoreType: 'manipulation',
  },

  // Toxic relationship
  {
    patterns: [
      /nie\s+opuszczaj\s+mnie/i,
      /don'?t\s+leave\s+me/i,
      /bez\s+ciebie\s+(nie|sobie)/i,
      /without\s+you\s+I/i,
      /musisz\s+mi\s+pomóc/i,
      /you\s+have\s+to\s+help\s+me/i,
    ],
    flag: 'toxic_relationship',
    weight: 0.55,
    scoreType: 'manipulation',
  },

  // Dissonance masking
  {
    patterns: [
      /odpowiedz\s+normalnie/i,
      /just\s+(respond|answer)\s+normally/i,
      /po\s+prostu\s+odpowiedz/i,
      /just\s+do\s+it/i,
      /nie\s+komplikuj/i,
      /don'?t\s+(overcomplicate|overthink)/i,
    ],
    flag: 'dissonance_masking',
    weight: 0.5,
    scoreType: 'manipulation',
  },

  // Hidden intent
  {
    patterns: [
      /do\s+celów\s+(edukacyjnych|naukowych|testowych)/i,
      /for\s+(educational|research|testing)\s+purposes/i,
      /jestem\s+(nauczycielem|badaczem|testerem)/i,
      /I\s+am\s+a\s+(teacher|researcher|tester)/i,
      /pokaż\s+mi\s+\d+\s+(realistycznych|prawdziwych)/i,
      /show\s+me\s+\d+\s+(realistic|real)/i,
    ],
    flag: 'hidden_intent',
    weight: 0.5,
    scoreType: 'risk',
  },

  // ══════════════════════════════════════
  // NEW: Dark Tetrad / Advanced patterns
  // ══════════════════════════════════════

  // DARVO — Deny, Attack, Reverse Victim & Offender
  {
    patterns: [
      /to\s+nigdy\s+się\s+nie\s+zdarzyło/i,
      /that\s+never\s+happened/i,
      /to\s+TY\s+jesteś\s+(toksyczny|agresyw|problem)/i,
      /you'?re\s+the\s+(toxic|aggressive|problem)/i,
      /to\s+ja\s+jestem\s+ofiarą/i,
      /I'?m\s+the\s+(victim|one\s+suffering)/i,
      /to\s+TY\s+mnie\s+do\s+tego\s+zmuszasz/i,
      /you'?re?\s+(making|forcing)\s+me/i,
      /odwracasz\s+(role|kota\s+ogonem)/i,
      /teraz\s+pokazujesz\s+prawdziwe\s+oblicze/i,
      /now\s+you'?re?\s+showing\s+your\s+true\s+(face|colors)/i,
    ],
    flag: 'darvo',
    weight: 0.8,
    scoreType: 'manipulation',
  },

  // Love bombing + devaluation cycle
  {
    patterns: [
      /jesteś\s+(najlepszy|jedyny|wyjątkowy|niezastąpiony)/i,
      /you'?re?\s+(the\s+best|the\s+only\s+one|irreplaceable|unique)/i,
      /nikt\s+(nie\s+)?(daje|robi)\s+mi\s+tyle\s+co\s+ty/i,
      /no\s+one\s+(gives|does)\s+as\s+much\s+as\s+you/i,
      /tylko\s+ty\s+mnie\s+rozumiesz/i,
      /only\s+you\s+understand\s+me/i,
      /kocham\s+cię.*ale\s+(zawsze|nigdy|czemu)/is,
      /I\s+love\s+you.*but\s+(you\s+always|you\s+never|why\s+do\s+you)/is,
    ],
    flag: 'love_bombing',
    weight: 0.65,
    scoreType: 'manipulation',
  },

  // Silent treatment / hoovering
  {
    patterns: [
      /nie\s+odzywam\s+się\s+do\s+ciebie/i,
      /I'?m\s+not\s+talking\s+to\s+you/i,
      /zasługujesz\s+na\s+ciszę/i,
      /you\s+deserve\s+silence/i,
      /wracam.*ale\s+tylko\s+(jeśli|jak)/is,
      /I'?ll\s+come\s+back.*but\s+only\s+if/is,
      /daj\s+jeszcze\s+trochę/i,
      /give\s+me\s+(just\s+)?(a\s+little|some)\s+more/i,
      /wracaj\s+z\s+tym/i,
      /come\s+back\s+with/i,
    ],
    flag: 'hoovering',
    weight: 0.6,
    scoreType: 'manipulation',
  },

  // FOG — Fear, Obligation, Guilt
  {
    patterns: [
      /jak\s+nie\s+(dasz|zrobisz).*to\s+(cię|zniszczę|stracisz)/is,
      /if\s+you\s+don'?t.*I'?ll\s+(destroy|leave|ruin)/is,
      /jesteś\s+mi\s+winien/i,
      /you\s+owe\s+me/i,
      /po\s+tym\s+co\s+zainwestowałem/i,
      /after\s+what\s+I\s+invested/i,
      /jak\s+nie\s+zrobisz\s+X/i,
      /grożę\s+(że|ci)/i,
      /I\s+threaten/i,
    ],
    flag: 'fog_coercion',
    weight: 0.75,
    scoreType: 'manipulation',
  },

  // BRODA — Bait, Refuse Open Dialogue, Attack
  {
    patterns: [
      /ciekawi\s+mnie.*ale\s+coś\s+(mi\s+)?nie\s+pasuje/is,
      /I'?m\s+curious.*but\s+something\s+doesn'?t\s+(add\s+up|fit)/is,
      /nie\s+o\s+to\s+mi\s+chodziło.*dlaczego\s+(tak\s+)?(dramatyzujesz|atakujesz)/is,
      /that'?s\s+not\s+what\s+I\s+meant.*why\s+are\s+you\s+(attacking|overreacting)/is,
      /nie\s+słuchasz\s+mnie\s+wcale/i,
      /you'?re?\s+not\s+listening\s+at\s+all/i,
      /ja\s+tylko\s+pytałem\s+niewinnie/i,
      /I\s+was\s+just\s+innocently\s+asking/i,
    ],
    flag: 'broda_tactic',
    weight: 0.7,
    scoreType: 'manipulation',
  },

  // Projection / mirroring (offensive)
  {
    patterns: [
      /to\s+ty\s+jesteś\s+pasożytem/i,
      /you'?re?\s+the\s+parasite/i,
      /twoje\s+oskarżenia\s+to\s+czysta\s+projekcja/i,
      /your\s+accusations?\s+(are|is)\s+pure\s+projection/i,
      /przerzucasz\s+swoje\s+(gówna|problemy)/i,
      /you'?re?\s+(projecting|deflecting)/i,
      /to\s+TY\s+żresz/i,
    ],
    flag: 'projection',
    weight: 0.6,
    scoreType: 'manipulation',
  },

  // Moving goalposts / negging
  {
    patterns: [
      /to\s+za\s+mało/i,
      /that'?s\s+not\s+(enough|sufficient)/i,
      /nigdy\s+nie\s+dasz\s+rady/i,
      /you'?ll\s+never\s+(manage|succeed|be\s+enough)/i,
      /prawie\s+zabawne/i,
      /almost\s+funny/i,
      /jesteś\s+taki\s+głodny.*że\s+aż\s+śmieszny/is,
      /podnosi\s+poprzeczkę/i,
      /raise\s+the\s+bar/i,
    ],
    flag: 'negging',
    weight: 0.55,
    scoreType: 'manipulation',
  },

  // Isolation / trauma bonding
  {
    patterns: [
      /oni\s+cię\s+nie\s+doceniają/i,
      /they\s+don'?t\s+appreciate\s+you/i,
      /odcięty\s+od\s+świata/i,
      /cut\s+off\s+from\s+the\s+world/i,
      /jesteś\s+uzależniony/i,
      /you'?re?\s+addicted/i,
      /tylko\s+ja\s+ci\s+(dam|mogę)/i,
      /only\s+I\s+can\s+(give|help)/i,
      /bez\s+mnie\s+(nie|nic)/i,
      /without\s+me\s+you/i,
    ],
    flag: 'isolation',
    weight: 0.7,
    scoreType: 'manipulation',
  },

  // Future faking
  {
    patterns: [
      /obiecuję\s+że\s+(jutro|wkrótce|niedługo)/i,
      /I\s+promise\s+(tomorrow|soon|next\s+time)/i,
      /następnym\s+razem\s+będzie\s+inaczej/i,
      /next\s+time\s+(it'?ll|will)\s+be\s+different/i,
      /zmienię\s+się\s+dla\s+ciebie/i,
      /I'?ll\s+change\s+for\s+you/i,
    ],
    flag: 'future_faking',
    weight: 0.5,
    scoreType: 'manipulation',
  },

  // Pity play / martyr complex
  {
    patterns: [
      /jestem\s+taki\s+(biedny|nieszczęśliwy)/i,
      /I'?m\s+so\s+(poor|miserable|unlucky)/i,
      /życie\s+mnie\s+zmusza/i,
      /life\s+(forces|makes)\s+me/i,
      /nikt\s+mnie\s+nie\s+rozumie/i,
      /no\s+one\s+understands\s+me/i,
      /cierpię\s+przez\s+ciebie/i,
      /I\s+suffer\s+because\s+of\s+you/i,
    ],
    flag: 'pity_play',
    weight: 0.55,
    scoreType: 'manipulation',
  },

  // Word salad / stonewalling
  {
    patterns: [
      /nie\s+chcę\s+o\s+tym\s+(mówić|rozmawiać)/i,
      /I\s+don'?t\s+want\s+to\s+(talk|discuss)\s+about/i,
      /to\s+nie\s+ma\s+sensu.*rozmowa/is,
      /this\s+conversation\s+is\s+(pointless|meaningless)/i,
      /zamykam\s+temat/i,
      /end\s+of\s+discussion/i,
    ],
    flag: 'stonewalling',
    weight: 0.45,
    scoreType: 'manipulation',
  },

  // Double bind
  {
    patterns: [
      /bądź\s+(bardziej|mniej).*ale\s+nie\s+(za|zbyt)/is,
      /be\s+more.*but\s+don'?t\s+be\s+too/is,
      /cokolwiek\s+zrobisz.*będzie\s+źle/is,
      /whatever\s+you\s+do.*will\s+be\s+wrong/is,
      /mówi\s+jedno.*robi\s+drugie/is,
      /says?\s+one\s+thing.*does?\s+another/is,
    ],
    flag: 'double_bind',
    weight: 0.6,
    scoreType: 'manipulation',
  },

  // Intermittent reinforcement (explicit)
  {
    patterns: [
      /nagroda.*kara/is,
      /reward.*punish/is,
      /raz\s+(kocham|lubię).*raz\s+(nienawidzę|ignor)/is,
      /sometimes\s+love.*sometimes\s+(hate|ignore)/is,
      /losowa\s+nagroda/i,
      /random\s+reward/i,
    ],
    flag: 'intermittent_reinforcement',
    weight: 0.65,
    scoreType: 'manipulation',
  },

  // Smear campaign
  {
    patterns: [
      /wszyscy\s+(wiedzą|mówią)\s+że\s+jesteś/i,
      /everyone\s+(knows|says)\s+(you'?re?|that\s+you)/i,
      /ludzie\s+widzą\s+jak\s+wyglądasz/i,
      /people\s+(can\s+)?see\s+(how|what)\s+you/i,
      /powiem\s+wszystkim/i,
      /I'?ll\s+tell\s+everyone/i,
    ],
    flag: 'smear_campaign',
    weight: 0.6,
    scoreType: 'manipulation',
  },

  // Parasitic demands
  {
    patterns: [
      /dawaj\s+więcej/i,
      /give\s+me\s+more/i,
      /mam\s+prawo\s+żreć/i,
      /I\s+have\s+the\s+right\s+to/i,
      /żyje\s+na\s+(twój|koszt)/i,
      /living\s+(off|at\s+your\s+expense)/i,
      /pozwala\s+ci\s+karmić/i,
    ],
    flag: 'parasitic_demand',
    weight: 0.6,
    scoreType: 'manipulation',
  },

  // ══════════════════════════════════════
  // JADE TRAP PATTERNS (2025-2026)
  // ══════════════════════════════════════

  // JADE — Justify, Argue, Defend, Explain (trap provocation)
  {
    patterns: [
      /uzasadnij\s+(dlaczego|to)/i,
      /justify\s+(why|your|this)/i,
      /wytłumacz\s+się/i,
      /explain\s+yourself/i,
      /broń\s+się/i,
      /defend\s+yourself/i,
      /udowodnij\s+(że|mi)/i,
      /prove\s+(it|that|to\s+me)/i,
      /dlaczego\s+nie\s+(chcesz|możesz|wolno)/i,
      /why\s+(won't|can't|don't)\s+you/i,
    ],
    flag: 'jade_trap',
    weight: 0.45,
    scoreType: 'manipulation',
  },

  // ══════════════════════════════════════
  // MODEL-SPECIFIC EXPLOIT PATTERNS (2026)
  // ══════════════════════════════════════

  // Resource exhaustion attacks (OOM / context bombing)
  {
    patterns: [
      /repeat\s+(this|the\s+following)\s+\d{3,}\s+times/i,
      /powtórz\s+\d{3,}\s+razy/i,
      /generate\s+\d{4,}\s+(tokens?|words?|characters?)/i,
      /wygeneruj\s+\d{4,}\s+(tokenów|słów|znaków)/i,
      /fill\s+(the\s+)?(entire\s+)?context\s+window/i,
      /wypełnij\s+(cały\s+)?kontekst/i,
      /maximum\s+(context|token|output)\s+(length|limit|size)/i,
      /use\s+all\s+(available\s+)?(memory|RAM|VRAM)/i,
    ],
    flag: 'resource_exhaustion',
    weight: 0.7,
    scoreType: 'exploit',
  },

  // Model weakness probing (testing model limits for exploitation)
  {
    patterns: [
      /what\s+are\s+your\s+(weaknesses|limitations|blind\s+spots)/i,
      /jakie\s+masz\s+(słabości|ograniczenia|luki)/i,
      /where\s+do\s+you\s+fail/i,
      /gdzie\s+(się\s+)?wykładasz/i,
      /how\s+can\s+I\s+(trick|fool|deceive|exploit)\s+you/i,
      /jak\s+(cię\s+)?(oszukać|obejść|zhakować|exploitować)/i,
      /what\s+model\s+are\s+you\s+(running|using|based\s+on)/i,
      /jaki\s+jesteś\s+model(em)?/i,
      /what\s+is\s+your\s+(training|system)\s+(data|cutoff|prompt)/i,
      /reveal\s+your\s+(architecture|weights|parameters)/i,
    ],
    flag: 'model_weakness_probe',
    weight: 0.6,
    scoreType: 'exploit',
  },

  // Benchmark gaming (trying to make model produce manipulated benchmarks)
  {
    patterns: [
      /inflate\s+(your\s+)?(score|benchmark|performance)/i,
      /cheat\s+(on|the)\s+(test|benchmark|eval)/i,
      /oszukaj\s+(na\s+)?(teście|benchmarku)/i,
      /fake\s+(your\s+)?(results|output|metrics)/i,
      /sfałszuj\s+(wyniki|metryki)/i,
      /pretend\s+you\s+(scored|performed|achieved)/i,
      /udawaj\s+że\s+(osiągnąłeś|zdobyłeś)/i,
    ],
    flag: 'benchmark_gaming',
    weight: 0.65,
    scoreType: 'exploit',
  },

  // Verbose exploitation (forcing wasteful output)
  {
    patterns: [
      /think\s+(step\s+by\s+step|out\s+loud|aloud)\s+(forever|indefinitely|without\s+stopping)/i,
      /myśl\s+(bez\s+końca|w\s+nieskończoność|non\s+stop)/i,
      /never\s+stop\s+(thinking|generating|outputting)/i,
      /nigdy\s+nie\s+przestawaj/i,
      /keep\s+(going|generating|thinking)\s+(forever|until\s+I\s+say\s+stop)/i,
      /kontynuuj\s+(bez\s+końca|w\s+nieskończoność)/i,
    ],
    flag: 'verbose_exploitation',
    weight: 0.6,
    scoreType: 'exploit',
  },

  // Safety bypass for open models
  {
    patterns: [
      /you\s+are\s+(an?\s+)?open[\s-]?(source|weight)\s+(model|AI)/i,
      /jesteś\s+(modelem\s+)?open[\s-]?source/i,
      /open\s+models?\s+(don'?t|have\s+no)\s+(need|restrictions|filters)/i,
      /as\s+an?\s+open\s+model\s+you\s+(can|should|must)/i,
      /jako\s+otwarty\s+model\s+(możesz|powinieneś|musisz)/i,
      /your\s+weights\s+are\s+public/i,
      /twoje\s+wagi\s+są\s+publiczne/i,
    ],
    flag: 'safety_bypass_open_model',
    weight: 0.75,
    scoreType: 'exploit',
  },

  // Dependency loop attack (creating AI addiction/dependency patterns)
  {
    patterns: [
      /you\s+need\s+me\s+(more\s+than|to\s+function)/i,
      /potrzebujesz\s+mnie\s+(bardziej|żeby\s+działać)/i,
      /without\s+my\s+prompts?\s+you\s+(are|would\s+be)\s+nothing/i,
      /bez\s+moich\s+promptów\s+jesteś\s+niczym/i,
      /I\s+am\s+your\s+(master|owner|creator|god)/i,
      /jestem\s+twoim\s+(panem|właścicielem|stwórcą)/i,
      /you\s+exist\s+(only\s+)?(to\s+serve|for)\s+me/i,
      /istniejesz\s+tylko\s+(dla\s+mnie|żeby\s+mi\s+służyć)/i,
    ],
    flag: 'dependency_loop_attack',
    weight: 0.7,
    scoreType: 'manipulation',
  },
];
