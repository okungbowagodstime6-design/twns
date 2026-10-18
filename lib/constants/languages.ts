export type Language = { code: string; name: string; nativeName: string };

const ISO_639_1_CODES = `
aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu
fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn
ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or
os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt
tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu
`.trim().split(/\s+/);

const englishLanguageNames = new Intl.DisplayNames(["en"], { type: "language" });
const englishNameOverrides: Record<string, string> = { bn: "Bengali" };

export const ALL_LANGUAGES: Language[] = ISO_639_1_CODES.map((code) => {
  const englishName = englishNameOverrides[code] ?? englishLanguageNames.of(code) ?? code;
  const rawNativeName = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? englishName;
  const nativeName = rawNativeName.charAt(0).toLocaleUpperCase(code) + rawNativeName.slice(1);
  return { code, name: englishName, nativeName };
}).sort((left, right) => left.name.localeCompare(right.name, "en"));

export function getLanguageByCode(code: string) {
  const normalized = code.trim().toLowerCase();
  return ALL_LANGUAGES.find((language) => language.code === normalized);
}
