/**
 * American spelling of the British headwords in the Cambridge lists. The program writes American
 * English (content/primary/AUTHORING.md). The graph node keeps the British headword, so a package
 * that glosses the American form must resolve its node by the headword (see `britishHeadword`).
 */
export const AMERICAN_SPELLING: Record<string, string> = {
    practise: 'practice',
    moustache: 'mustache',
    colour: 'color',
    colours: 'colors',
    harbour: 'harbor',
    neighbour: 'neighbor',
    licence: 'license',
    programme: 'program',
    aeroplane: 'airplane',
    cheque: 'check',
    grey: 'gray',
    favourite: 'favorite',
    centre: 'center',
    theatre: 'theater',
    metre: 'meter',
    litre: 'liter',
    mum: 'mom',
    jewellery: 'jewelry',
    pyjamas: 'pajamas',
    tyre: 'tire',
    plough: 'plow',
    storey: 'story',
    cosy: 'cozy',
    ageing: 'aging',
    skilful: 'skillful',
};

/**
 * Writes a word in American spelling.
 * @param word a word of a Cambridge list
 * @returns the American form, or the word itself when the map has no entry
 */
export function americanSpelling(word: string): string {
    return AMERICAN_SPELLING[word] ?? word;
}

/**
 * Finds the British headword of an American form.
 * @param word a required word in American spelling
 * @returns the British headword that the graph node uses, or undefined when the map has no entry
 */
export function britishHeadword(word: string): string | undefined {
    return Object.entries(AMERICAN_SPELLING).find(([, us]) => us === word)?.[0];
}
