import { AMERICAN_SPELLING, americanSpelling, britishHeadword } from '../text-profile/spelling';

export { AMERICAN_SPELLING, americanSpelling, britishHeadword };

/**
 * Pure logic of the bank article plans for levels 5-9 (track levels_5_9_20261006, Phase 1).
 * `scripts/plan-level-bank.ts` reads the files and writes the plan; this module holds the text type
 * specs, the cast notes, and the glossed-word assignment, so tests can run it without files.
 */

/** A text type of a bank: `count` articles that share the type, the targets, and the note. */
export interface BankTemplate {
    type: string;
    app: 'fiction' | 'nonfiction';
    count: number;
    objectives: string[];
    supporting?: string[];
    topics: string[];
    note: string;
}

/** The Cambridge lists that supply required glossed words at levels 5-9. */
export type WordList = 'movers' | 'flyers' | 'a2key';

/** Words of one list by topic key (the headings of the word list files), already without glossed words. */
export type WordPools = Record<WordList, Record<string, string[]>>;

/** Bank levels that have no production inventory and no workbook old ids. */
export const NEW_BANK_LEVELS = [5, 6, 7, 8, 9];

/** Bank articles per level (plan section 2). */
export const BANK_COUNTS: Record<number, number> = { 5: 36, 6: 72, 7: 72, 8: 108, 9: 108 };

/** Workbook lessons per level (14 for each book): used for the total of the level. */
export const WORKBOOK_LESSONS: Record<number, number> = { 5: 14, 6: 28, 7: 28, 8: 42, 9: 42 };

/** Books of each level, as in `levels-5-9-objectives.json`. */
export const LEVEL_BOOKS: Record<number, string[]> = {
    5: ['quest-5'],
    6: ['quest-6.1', 'quest-6.2'],
    7: ['adventure-7.1', 'adventure-7.2'],
    8: ['adventure-8.1', 'adventure-8.2', 'adventure-8.3'],
    9: ['adventure-9.1', 'adventure-9.2', 'adventure-9.3'],
};

/** Cast and world of each level (plan section 8), added to the note of each article. */
export const CAST: Record<number, string> = {
    5: 'Cast: Tom (11), Lily (9), Pip (a small brown puppy), and their friends.',
    6: 'Cast: Tom (12), Lily (10), Pip (a small brown puppy), and their friends.',
    7: 'Cast: Tom and Lily, older now, with the school club (it goes on trips), the class blog, and the pen-pal class (children who are not Thai). Pip is in some stories.',
    8: 'Cast: Tom and Lily, older now, with the school club (it goes on trips), the class blog, and the pen-pal class (children who are not Thai). Pip is in some stories.',
    9: 'Cast: Tom and Lily, older now, with the school club (it goes on trips), the class blog, and the pen-pal class (children who are not Thai). Pip is in some stories.',
};

/** Lists whose every word the plan of a level must require at least once, where the slot count allows. */
export const COVER_LISTS: Record<number, WordList[]> = { 5: ['movers'], 6: ['movers'], 7: ['flyers'], 8: ['flyers'], 9: ['a2key'] };

/** Words that each article gets from each list, by position in the level (0-based). */
export function wordSegments(level: number, index: number): { list: WordList; count: number }[] {
    switch (level) {
        case 5:
            return [{ list: 'movers', count: 6 }];
        case 6:
            // Quest 6.1 (first half of the bank) has more Movers words, Quest 6.2 more Flyers words.
            return index < BANK_COUNTS[6] / 2 ? [{ list: 'movers', count: 3 }, { list: 'flyers', count: 3 }] : [{ list: 'movers', count: 1 }, { list: 'flyers', count: 5 }];
        case 7:
            return [{ list: 'flyers', count: 6 }];
        case 8:
            return [{ list: 'flyers', count: 2 }, { list: 'a2key', count: 4 }];
        default:
            return [{ list: 'a2key', count: 6 }];
    }
}

/** Topic keys that mean the same area in the YLE lists and in the A2 Key list. */
const TOPIC_GROUPS: string[][] = [
    ['animals', 'the-natural-world', 'the-world-around-us', 'places-countryside'],
    ['the-body-and-the-face', 'health', 'health-medicine-and-exercise'],
    ['clothes', 'clothes-and-accessories'],
    ['colours', 'colors'],
    ['family-and-friends'],
    ['food-and-drink'],
    ['the-home', 'house-and-home', 'appliances', 'materials'],
    ['places-and-directions', 'places-buildings', 'places-town-and-city', 'services'],
    ['school', 'education', 'documents-and-texts'],
    ['sports-and-leisure', 'sport', 'hobbies-and-leisure', 'entertainment-and-media', 'toys'],
    ['time'],
    ['transport', 'travel-and-transport'],
    ['weather'],
    ['work', 'work-and-jobs'],
    ['communication-and-technology'],
    ['personal-feelings-opinions-and-experiences'],
    ['measurements', 'numbers'],
    ['shopping'],
];

/**
 * Names the topic group of a topic key.
 * @param key a topic key from a word list or from a text type spec
 * @returns the first key of the group, or the key itself when it has no group
 */
export function topicGroup(key: string): string {
    return (TOPIC_GROUPS.find((g) => g.includes(key)) ?? [key])[0];
}

const f = (type: string, count: number, objectives: string[], supporting: string[], topics: string[], note: string): BankTemplate => ({ type, app: 'fiction', count, objectives, supporting, topics, note });
const n = (type: string, count: number, objectives: string[], supporting: string[], topics: string[], note: string): BankTemplate => ({ type, app: 'nonfiction', count, objectives, supporting, topics, note });

/** Text type specs of the banks of levels 5-9. */
export const BANK_TEMPLATES: Record<number, BankTemplate[]> = {
    5: [
        f('story: a cartoon story with key words', 4, ['R24.4', 'L24.2', 'L25.4'], ['R22.3'], ['animals', 'family-and-friends', 'toys', 'sports-and-leisure'], 'A short cartoon-style story of 5 or 6 pictures. Key words repeat. A small problem and a kind ending.'),
        f('story: dialogue with pictures', 3, ['R26.5', 'R24.6'], ['R24.3'], ['school', 'the-home', 'food-and-drink'], 'A story told mostly in dialogue. Each speaker has a name and a clear turn.'),
        f('story: names of people and places', 2, ['R24.5', 'R24.3'], ['R22.3'], ['places-and-directions', 'the-world-around-us', 'family-and-friends'], 'Names of people and places with capital letters (Tom, Lily, Bangkok, the City Park). A friend visits a new place.'),
        f('story: the weather', 3, ['L24.5', 'R25.5', 'L25.3'], ['L24.2'], ['weather', 'sports-and-leisure', 'clothes', 'the-world-around-us'], 'Weather words (sunny, rainy, windy, cold, hot) decide what the children do and wear.'),
        f('story: a chant with repeated lines', 3, ['R25.1', 'R26.1'], ['L24.2'], ['animals', 'food-and-drink', 'the-body-and-the-face', 'sports-and-leisure'], 'The children say a chant or poem with 2 or 3 repeated lines inside a short scene.'),
        f('story: a phone call', 3, ['L26.4', 'L25.1'], ['R26.5'], ['family-and-friends', 'time', 'the-home'], 'A phone call. The caller says a name and a phone number (digits as words). Put the number in the text.'),
        n('family page', 2, ['L26.2', 'R26.3', 'L24.3'], ['R22.1'], ['family-and-friends', 'the-home', 'animals'], 'A page about one family: who is in it, and what each person has (a bike, a cat, two books).'),
        n('describing a person', 2, ['R26.2', 'L24.1', 'R24.2'], ['L23.6'], ['the-body-and-the-face', 'clothes', 'family-and-friends'], 'Hair, eyes, height, and age of a child or an animal. Short sentences, one fact in each.'),
        n('clothes and what people wear', 2, ['L26.3', 'R25.2'], ['R22.1'], ['clothes', 'colors', 'weather'], 'People and their clothes: "Lily has a red coat." The pictures show the clothes.'),
        n('likes and dislikes', 2, ['R26.6', 'R25.4'], ['L23.3'], ['food-and-drink', 'sports-and-leisure', 'animals', 'school'], 'A child says what she or he likes and does not like. Positive and negative sentences in pairs.'),
        n('directions and where things are', 2, ['L25.2', 'L24.4', 'R25.2'], ['R23.8'], ['places-and-directions', 'transport', 'the-home'], 'Simple directions ("Go straight. Turn left.") and where things or people are (in, on, under, next to).'),
        n('a day plan to the half hour', 2, ['L25.5', 'R25.3'], ['L23.2'], ['time', 'school', 'sports-and-leisure'], 'A plan with times as full and half hours ("at half past four"). Numbers in words.'),
        n('the date and ordinal numbers', 2, ['L24.6', 'L26.1'], ['R22.2'], ['time', 'family-and-friends', 'sports-and-leisure'], 'A birthday, a race, or a calendar page: the day and the date, ordinal numbers to fifty (as words).'),
        n('personal details and what I need', 2, ['L25.1', 'L25.6'], ['L23.3'], ['health', 'food-and-drink', 'school', 'the-body-and-the-face'], 'A child gives name, age, and home, and says what she or he needs ("I\'m thirsty. I need a glass of water.").'),
        n('a text with pictures', 2, ['R25.2', 'R24.2', 'R24.6'], [], ['animals', 'the-world-around-us', 'the-home', 'toys'], 'Short sentences that name items in a picture (a toy shop, a farm, a room). Each sentence names a picture item.'),
    ],
    6: [
        f('story: the gist of an illustrated story', 4, ['R28.2', 'R29.5'], ['R25.2'], ['family-and-friends', 'school', 'sports-and-leisure', 'animals', 'the-home'], 'A short story of everyday activities with 6 pictures. The first and last sentences give the gist.'),
        f('story: predicting from pictures', 3, ['R27.2', 'R29.2'], ['R26.5'], ['animals', 'the-world-around-us', 'toys'], 'The pictures show the problem, not the answer. The text asks the reader to guess what happens next.'),
        f('story: what a character likes', 3, ['R29.3', 'L27.4'], ['R26.6'], ['food-and-drink', 'sports-and-leisure', 'animals', 'clothes'], 'Pictures and small choices show what one character likes. Another character guesses it.'),
        f('story: a traditional story with repeated lines', 4, ['L28.4', 'L27.2'], ['R25.1'], ['animals', 'food-and-drink', 'the-world-around-us'], 'A short traditional tale (for example a fox, a rabbit, or a big turnip) with a repeated line and gestures.'),
        f('dialogue: names and places', 3, ['L27.5', 'L27.7'], ['L26.4'], ['places-and-directions', 'family-and-friends', 'transport'], 'Children talk about who goes where. Names of people and places are easy to find.'),
        f('dialogue: where and when to meet', 4, ['R29.4', 'R27.7', 'L27.7'], ['L25.5'], ['time', 'places-and-directions', 'sports-and-leisure', 'school'], 'Friends make a plan: the place, the day, and the time ("at the library on Saturday at ten").'),
        f('story: spoken instructions', 3, ['L27.1', 'L28.2'], ['L25.2'], ['school', 'sports-and-leisure', 'the-body-and-the-face'], 'A game or a class where one child gives clear instructions, with pauses ("Stand up. Touch your toes.").'),
        f('story: can and can\'t', 3, ['L28.3', 'L28.1'], ['L23.1'], ['animals', 'sports-and-leisure', 'toys', 'the-body-and-the-face'], 'What people and animals can or can\'t do. A child names an object from its description.'),
        f('story: a day of routines', 3, ['L29.1', 'L28.2'], ['L25.5'], ['time', 'the-home', 'school', 'food-and-drink'], 'A day told with routines ("Every day, Tom gets up at seven.") and a small change.'),
        f('story: a poem with repeated words', 2, ['L27.2'], ['R25.1', 'R26.1'], ['weather', 'animals', 'the-world-around-us'], 'A short poem inside a scene, with repeated words or lines.'),
        f('story: a lost friend', 4, ['L27.6', 'L27.3', 'R27.3'], ['L26.3'], ['clothes', 'the-body-and-the-face', 'places-and-directions', 'family-and-friends'], 'Someone is lost. The other children find the person from the look and the clothes.'),
        n('written directions', 4, ['R27.1', 'R27.7'], ['L25.2'], ['places-and-directions', 'transport', 'the-world-around-us'], 'Short written directions from X to Y, with a simple map as a picture ("Go from the school to the park.").'),
        n('a school timetable', 3, ['R27.4', 'R28.3'], ['R22.2'], ['school', 'time'], 'A timetable with days, times, and classes. The times are in words and numbers.'),
        n('time as words', 3, ['R28.3', 'L29.2'], ['L25.5'], ['time', 'sports-and-leisure', 'transport'], 'Times written as words ("a quarter to eight") in a day plan, a bus list, or a TV list.'),
        n('a menu with pictures', 3, ['R27.6', 'L29.2'], ['R26.6'], ['food-and-drink', 'places-and-directions'], 'A menu with pictures, names, and prices. A short note says who orders what.'),
        n('describing an object', 3, ['R27.5', 'R27.3'], ['R24.2'], ['toys', 'the-home', 'animals', 'colors', 'materials'], 'Color, size, and shape of an object, an animal, or a person. Short sentences with pictures.'),
        n('product labels', 3, ['R28.1', 'R29.8'], ['R24.2'], ['food-and-drink', 'clothes', 'health', 'toys'], 'Labels on products (a food box, a toy, a medicine bottle, a T-shirt). Put each label text in a picture overlay.'),
        n('making something', 4, ['R28.4'], ['R27.1', 'R29.8'], ['school', 'toys', 'materials', 'the-home'], 'Numbered steps to make a mask, a clock, or a card, with a list of things to use. Pictures show the steps.'),
        n('notes and messages', 4, ['R29.8', 'R29.4'], ['R24.3'], ['family-and-friends', 'school', 'the-home', 'places-and-directions'], 'Short notes and messages (a note on the fridge, a text to a friend, a note from a teacher). Key words about when and where.'),
        n('ordinal numbers as words', 3, ['R29.6', 'R28.3'], ['L24.6'], ['sports-and-leisure', 'school', 'time'], 'A race, a line, a birthday list, or floors of a building. Ordinal numbers to fifty, as words.'),
        n('prices, times, and dates', 3, ['L29.2', 'L29.1'], ['R28.3'], ['food-and-drink', 'time', 'sports-and-leisure', 'places-and-directions'], 'A short text with prices, times, and dates (a shop sign, a ticket, a class list). Put the numbers in the picture too.'),
        n('an event poster', 3, ['L27.7', 'R29.4'], ['R28.3'], ['sports-and-leisure', 'school', 'places-and-directions', 'time'], 'A poster for a school event: what, where, and when. A short note from a child asks a friend to come.'),
    ],
    7: [
        f('story: the main idea of a picture story', 3, ['R30.3', 'R32.5'], ['R29.2'], ['animals', 'sports-and-leisure', 'places-and-directions'], 'A picture story of 6 pictures. The main idea is clear from the pictures. The events are in a clear order.'),
        f('story: a traditional story', 3, ['R31.6', 'R33.4'], ['L28.4'], ['animals', 'the-natural-world', 'family-and-friends'], 'A short traditional story from the world (a pen-pal class shares it). The theme is clear, for example "be kind".'),
        f('story: the theme of a story', 2, ['R33.4', 'R33.3'], ['R29.3'], ['school', 'family-and-friends', 'sports-and-leisure'], 'A school-club story with one theme (sharing, trying again, telling the truth). Questions can guide the reader to it.'),
        f('dialogue: details in a conversation', 2, ['R30.1', 'R31.2'], ['R26.5'], ['school', 'sports-and-leisure', 'food-and-drink'], 'Two or three children talk about a familiar activity. Several small details are in the talk.'),
        f('dialogue: a written conversation', 2, ['R32.6', 'L31.1'], ['R26.5'], ['school', 'communication-and-technology', 'sports-and-leisure'], 'A chat between club members or with the pen-pal class. A written dialogue with questions and answers.'),
        f('story: teacher feedback', 2, ['R30.7', 'L31.9'], ['L23.5'], ['school', 'sports-and-leisure'], 'A teacher or a classmate gives simple feedback ("Good try. Read it again.") and the child feels better.'),
        f('story: how people feel', 2, ['L31.9', 'L31.12'], ['R29.3'], ['personal-feelings-opinions-and-experiences', 'sports-and-leisure', 'family-and-friends'], 'Feelings (happy, sad, tired, worried, excited) and what people like and don\'t like.'),
        f('story: a rule with if', 2, ['L31.10', 'L33.2'], ['L28.2'], ['school', 'sports-and-leisure', 'places-and-directions'], 'A game or a trip where one rule has "if" ("If your shirt is blue, stand here.").'),
        f('dialogue: daily routines', 2, ['L31.11', 'L31.7'], ['L29.1'], ['time', 'school', 'food-and-drink', 'the-home'], 'Two children talk about their typical day and give personal details.'),
        f('dialogue: comparing things', 2, ['L31.13', 'L33.1'], ['R28.2'], ['animals', 'sports-and-leisure', 'places-and-directions', 'the-home'], 'Two people compare things or people (bigger, faster, more expensive).'),
        f('dialogue: prices and places', 2, ['L31.6', 'L31.5'], ['L29.2'], ['shopping', 'places-and-directions', 'time'], 'In a shop or at a station. A price, a place, and a time in a short talk.'),
        f('dialogue: hobbies and interests', 2, ['L33.3', 'L31.12'], ['L27.4'], ['hobbies-and-leisure', 'sports-and-leisure', 'entertainment-and-media'], 'Children talk about their hobbies and why they like them.'),
        f('dialogue: jobs', 2, ['L31.4', 'L31.3'], ['L24.1'], ['work', 'places-and-directions', 'school'], 'The club visits a place of work. A person says what the job is. A child names the person, place, or object from a short description.'),
        f('dialogue: where are we?', 2, ['L32.1', 'L33.2'], ['L27.7'], ['places-and-directions', 'transport', 'school'], 'A conversation in a known place (a shop, a bus, a clinic). The reader works out the place and finds one fact.'),
        f('story: who is it?', 2, ['L30.1', 'L31.3'], ['L27.6'], ['the-body-and-the-face', 'clothes', 'places-and-directions'], 'The children find a person from a short description of where the person is and what the person does.'),
        n('signs in a public building', 2, ['R30.2', 'R32.7'], ['R20.3'], ['places-and-directions', 'school', 'health'], 'A school, a library, or a hospital, with 4 to 6 signs and notices. Put each sign text in a picture overlay.'),
        n('an event poster', 2, ['R30.8', 'R33.1'], ['R29.4'], ['sports-and-leisure', 'school', 'time', 'places-and-directions'], 'A club poster for an event: the day, the time, and the place. A short message from a friend gives the same facts again.'),
        n('describing a house', 2, ['R30.6', 'L30.3'], ['R27.7'], ['the-home', 'house-and-home', 'family-and-friends'], 'A house or a flat of a pen pal: rooms and furniture. A picture shows a plan.'),
        n('describing people', 2, ['R30.5', 'L31.3'], ['R27.3'], ['the-body-and-the-face', 'clothes', 'family-and-friends'], 'Three people in a picture, described by looks and clothes. The reader finds each one.'),
        n('facts and pictures: yes or no', 2, ['R30.4', 'R31.1'], ['R25.2'], ['animals', 'the-world-around-us', 'sports-and-leisure'], 'A short factual text with a picture. A box with true or false statements.'),
        n('rules of a board game', 2, ['R31.3', 'L31.10'], ['R28.4'], ['toys', 'sports-and-leisure', 'school'], 'A short rule page for a board game: how to start, how to move, and how to win. Use "if" once.'),
        n('a typical day', 2, ['R31.4', 'L31.11'], ['L29.1'], ['time', 'school', 'family-and-friends'], 'A child tells about a typical day, with times and routines. Pictures help.'),
        n('word families', 2, ['R31.5', 'R32.2', 'L31.2'], ['R23.5'], ['clothes', 'the-body-and-the-face', 'food-and-drink', 'sports-and-leisure'], 'Words in the same area of meaning (head and hat, hand and glove, foot and shoe). The text names the groups.'),
        n('a note', 2, ['R32.1', 'R33.1'], ['R29.8'], ['family-and-friends', 'school', 'time'], 'A note from a parent, a teacher, or a friend. It gives time and place.'),
        n('a map with a key', 2, ['R32.4', 'R33.6'], ['R27.1'], ['places-and-directions', 'places-town-and-city', 'transport'], 'A town map or a school plan with a key (symbols and names). Text: what is where.'),
        n('a postcard', 2, ['R32.8', 'R33.3'], ['R29.4'], ['sports-and-leisure', 'weather', 'places-and-directions', 'food-and-drink'], 'A postcard from a holiday or a club trip. Details: place, weather, food, and what the writer did.'),
        n('a fact text with headings', 2, ['R33.2', 'R33.5'], ['R25.2'], ['animals', 'the-natural-world', 'sports-and-leisure', 'work'], 'A short factual text with headings and pictures. The order of the information is clear.'),
        n('jobs: a fact page', 2, ['L31.4', 'L31.2'], ['R30.4'], ['work', 'school'], 'A page about three jobs. Some words are new but a picture explains each one.'),
        n('announcements and recordings', 2, ['L33.4', 'L31.5'], ['L27.7'], ['school', 'sports-and-leisure', 'time', 'transport'], 'The text of a school announcement or a station announcement: day, date, place, and time.'),
        n('comparing two things', 2, ['L31.13', 'R30.4'], ['R27.5'], ['animals', 'sports-and-leisure', 'the-natural-world'], 'Two animals, two sports, or two places in a short text with a comparison in each sentence.'),
        n('a text and its context', 2, ['L32.1', 'L33.2'], ['R30.4'], ['places-and-directions', 'transport', 'shopping'], 'A text from an everyday place (a bus, a shop). The reader works out the place and finds one fact.'),
        n('a hobby profile', 2, ['L33.3', 'R30.1'], ['R26.6'], ['hobbies-and-leisure', 'sports-and-leisure', 'entertainment-and-media'], 'A club member tells about a hobby: what, when, and with whom.'),
        n('prices in a shop', 2, ['L31.6', 'R31.1'], ['L29.2'], ['shopping', 'food-and-drink', 'clothes'], 'A shop sign or a price list for a school sale. Answers to yes or no questions are in the text.'),
        n('a cartoon strip in order', 2, ['R32.5', 'R33.5'], ['R29.2'], ['animals', 'sports-and-leisure', 'school'], 'A cartoon strip told as a text with captions. The order of events is clear.'),
        n('a short story in words and pictures', 2, ['R30.3', 'R33.3'], ['R28.2'], ['family-and-friends', 'places-and-directions'], 'A club trip told in short captions that tell the main idea of the picture story.'),
    ],
    8: [
        f('story: linking words', 3, ['R34.4', 'L34.3', 'R35.5'], ['R33.5'], ['school', 'sports-and-leisure', 'family-and-friends'], 'A story with dialogue where "and", "so", and "but" join ideas in many sentences.'),
        f('story: details from questions', 3, ['R35.2', 'R34.1', 'R35.6'], ['R33.3'], ['school', 'the-natural-world', 'places-and-directions'], 'A story with many small facts (names, places, objects). The context is clear: a trip, a market, a match.'),
        f('dialogue: a school conversation', 2, ['L34.6', 'R34.2'], ['L33.2'], ['education', 'school', 'time'], 'Students talk about subjects, a timetable, or homework.'),
        f('dialogue: excuses', 2, ['L34.4', 'L34.2'], ['L31.9'], ['school', 'personal-feelings-opinions-and-experiences', 'time'], 'A child gives an excuse (late, no homework, no ball). The excuse is said in simple language with some repetition.'),
        f('dialogue: future plans', 3, ['L35.2', 'L35.1'], ['L33.4'], ['hobbies-and-leisure', 'travel-and-transport', 'time', 'sports-and-leisure'], 'Friends talk about plans for a trip or a weekend, using "going to" and "will".'),
        f('dialogue: comparing two places', 2, ['L35.3', 'L35.4'], ['L31.13'], ['places-town-and-city', 'places-countryside', 'travel-and-transport'], 'Two friends compare two places (a town and a village, two parks). The reader can tell where the talk takes place.'),
        f('story: past activities', 3, ['L36.2', 'L36.3', 'R38.3'], ['R33.5'], ['sports-and-leisure', 'family-and-friends', 'places-and-directions'], 'A story in the past simple: what the club did on a trip, in order.'),
        f('story: the theme and the parts', 4, ['R36.1', 'R38.12', 'R38.9'], ['R33.4'], ['school', 'family-and-friends', 'the-natural-world', 'sports-and-leisure'], 'A simple story with a clear theme and a clear beginning, middle, and end.'),
        f('dialogue: arrangements', 2, ['L36.5', 'L36.4'], ['L33.4'], ['time', 'hobbies-and-leisure', 'places-and-directions'], 'Friends arrange to do something and say what they like.'),
        f('dialogue: personalities', 2, ['L36.6', 'L37.2'], ['L31.9'], ['personal-feelings-opinions-and-experiences', 'family-and-friends', 'school'], 'Two people talk about a friend or a relative: a kind, funny, or shy person.'),
        f('story: the order of events', 4, ['R37.2', 'R38.9'], ['R33.5'], ['school', 'sports-and-leisure', 'places-and-directions', 'the-natural-world'], 'A story whose events happen in a clear order with words such as first, then, and after that.'),
        f('story: guessing new words', 2, ['R37.3', 'R38.5'], ['R31.5'], ['the-natural-world', 'places-countryside', 'sports-and-leisure'], 'A story with a few new words. A picture or the next sentence explains each one.'),
        f('story: who or what is it?', 2, ['R38.4', 'R37.10'], ['R35.2'], ['family-and-friends', 'school', 'animals'], 'Pronouns (he, she, it, they) refer to people and objects in the story. A fact that the reader already knows helps.'),
        f('story: because', 3, ['R38.7', 'R37.5'], ['R34.4'], ['school', 'family-and-friends', 'sports-and-leisure'], 'Characters explain their actions with "because".'),
        f('dialogue: agreeing and disagreeing', 2, ['L37.3', 'L38.3'], ['L36.4'], ['school', 'hobbies-and-leisure', 'food-and-drink'], 'Friends discuss a choice (a game, a film, a menu) and agree or disagree.'),
        f('dialogue: public transport', 2, ['L37.4', 'L34.5'], ['R32.4'], ['travel-and-transport', 'places-town-and-city', 'transport'], 'A conversation about how to go somewhere by bus or train, with a map.'),
        f('story: a phone call', 2, ['L38.5', 'L37.2'], ['L26.4'], ['family-and-friends', 'time', 'places-and-directions'], 'A phone call with a clear aim (an arrangement, a question, a change of plan).'),
        f('dialogue: steps to follow', 2, ['L37.1', 'R36.2'], ['L31.10'], ['school', 'food-and-drink', 'sports-and-leisure'], 'A teacher or a friend gives instructions in several steps.'),
        f('dialogue: a short talk with facts', 2, ['L38.1', 'L36.1'], ['L33.2'], ['school', 'the-natural-world', 'sports-and-leisure'], 'A club member gives a short talk with a name and a number in it.'),
        f('dialogue: key information', 2, ['L38.2', 'L35.6'], ['L33.4'], ['shopping', 'time', 'travel-and-transport'], 'A short passage or a description with a price, a time, or a date to find.'),
        n('a note from family or a friend', 2, ['R34.5', 'R35.4'], ['R32.1'], ['family-and-friends', 'school', 'time'], 'A short note with information that is important now, and some personal details.'),
        n('a leaflet', 2, ['R34.6', 'R34.8'], ['R30.8'], ['hobbies-and-leisure', 'places-buildings', 'sports-and-leisure'], 'A leaflet for a museum, a zoo, or a club (opening times, prices, rules). Facts and numbers.'),
        n('a paragraph about sports, music, or travel', 2, ['R34.7', 'R35.3'], ['R33.2'], ['sports-and-leisure', 'entertainment-and-media', 'travel-and-transport'], 'Short paragraphs with pictures about a sport, a kind of music, or a trip.'),
        n('a poster with facts and numbers', 2, ['R34.8', 'L35.5'], ['R33.2'], ['measurements', 'the-natural-world', 'sports-and-leisure', 'places-buildings'], 'A poster with facts and numbers (height, weight, length, distance, price).'),
        n('a contents page', 2, ['R34.9', 'R35.1'], ['R33.2'], ['education', 'documents-and-texts', 'the-natural-world'], 'A contents page of a club book or a school magazine, with page numbers and a few captions.'),
        n('safety rules', 2, ['R34.10', 'R36.2'], ['R32.7'], ['places-buildings', 'sport', 'health-medicine-and-exercise'], 'Safety instructions for a pool, a lab, or a bike. Pictures show each rule.'),
        n('a weather forecast', 2, ['L34.1', 'R34.3'], ['L24.5'], ['weather', 'the-natural-world', 'sports-and-leisure'], 'A written weather forecast for 3 days, with pictures and a short plan.'),
        n('directions on foot', 2, ['L34.5', 'R37.1'], ['R27.1'], ['places-town-and-city', 'places-and-directions', 'transport'], 'Directions to walk from one place to another, with a map.'),
        n('captions and key words', 2, ['R35.1', 'R38.1'], ['R34.9'], ['animals', 'the-natural-world', 'places-buildings'], 'Pictures with captions. The reader finds the best words to describe a picture.'),
        n('a factual text: key information', 2, ['R34.3', 'R37.6'], ['R33.2'], ['the-natural-world', 'work-and-jobs', 'school'], 'A short factual text about a familiar topic. Questions ask for specific details.'),
        n('computer game instructions', 2, ['R36.3', 'R36.2'], ['R31.3'], ['communication-and-technology', 'entertainment-and-media', 'toys'], 'The screens and feedback of a computer game ("Great! Level 2.", "Try again.").'),
        n('measurements and prices', 2, ['L35.5', 'L35.6'], ['L31.6'], ['measurements', 'shopping', 'the-natural-world'], 'A description of an object, an animal, or a building with measurements, prices, and dates.'),
        n('a diagram', 2, ['R37.1', 'R38.2'], ['R33.2'], ['the-natural-world', 'appliances', 'the-body-and-the-face'], 'A simple diagram (the water cycle, a plant, a machine) with labels and short text.'),
        n('two texts on one topic', 2, ['R37.4', 'R37.6'], ['R33.2'], ['animals', 'places-countryside', 'sports-and-leisure', 'travel-and-transport'], 'Two short texts on the same topic. The reader finds the same and different facts.'),
        n('a biography', 3, ['R37.7', 'R38.8'], ['R33.5'], ['work-and-jobs', 'sport', 'entertainment-and-media'], 'A short biography of a person from the past or today, with dates and places, as a club project.'),
        n('a diary entry', 3, ['R37.9', 'R38.3'], ['R33.5'], ['hobbies-and-leisure', 'sports-and-leisure', 'places-and-directions'], 'A diary entry about a trip or a day, with likes and what the writer did.'),
        n('an email', 3, ['R37.9', 'R38.10'], ['R33.1'], ['communication-and-technology', 'family-and-friends', 'hobbies-and-leisure'], 'An email to the pen-pal class with an opening and a closing expression ("Dear …", "Best wishes,").'),
        n('an animal fact file', 3, ['R38.6', 'R38.8'], ['R33.2'], ['animals', 'the-natural-world'], 'A fact file with a few new words and pictures: size, food, home, and life.'),
        n('a recipe', 3, ['R38.11', 'L37.1'], ['R36.2'], ['food-and-drink', 'appliances'], 'A simple recipe with a list of things and numbered steps. Pictures show the steps.'),
        n('linking words in paragraphs', 2, ['R37.5', 'R34.4'], ['R33.5'], ['school', 'the-natural-world', 'sports-and-leisure'], 'Two short paragraphs with "and", "so", "but", and "because" that link ideas.'),
        n('school subjects and timetable', 2, ['L34.6', 'L38.2'], ['R27.4'], ['education', 'time', 'school'], 'A timetable, subjects, and homework in a class blog entry.'),
        n('a phone message', 2, ['L38.4', 'L38.1'], ['L26.4'], ['entertainment-and-media', 'places-buildings', 'time'], 'The text of a recorded message (a cinema, a pool, a school). Names, numbers, and times.'),
        n('the main topic of a text', 2, ['R38.8', 'R38.12'], ['R35.3'], ['the-natural-world', 'education', 'food-and-drink'], 'A structured text (title, 3 paragraphs). Each paragraph has one clear topic.'),
        n('where and when plans', 2, ['L35.2', 'L36.5'], ['R33.1'], ['time', 'travel-and-transport', 'hobbies-and-leisure'], 'A written plan or invitation for a trip, with arrangements to do something together.'),
        n('preferences and personalities', 2, ['L38.3', 'L36.6'], ['R32.1'], ['personal-feelings-opinions-and-experiences', 'family-and-friends', 'hobbies-and-leisure'], 'A page with four children: what each one likes and what each one is like.'),
        n('agreement in a class discussion', 2, ['L37.3', 'L37.2'], ['L34.4'], ['school', 'sports-and-leisure', 'communication-and-technology'], 'A written class blog discussion where children agree or disagree.'),
        n('a conversation in a context', 2, ['L35.4', 'R35.6'], ['L32.1'], ['places-buildings', 'shopping', 'travel-and-transport'], 'A text from a place the reader can name (a shop, a bus, a gym). The context is clear.'),
    ],
    9: [
        f('story: how a character feels', 3, ['R40.1', 'L39.3'], ['R33.4'], ['personal-feelings-opinions-and-experiences', 'school', 'family-and-friends'], 'Feelings are not named. Actions and words show them.'),
        f('story: predicting from the title', 3, ['R39.2', 'R42.2'], ['R32.5'], ['the-natural-world', 'places-countryside', 'sports-and-leisure'], 'A story with a clear title. Hints in the text let the reader guess what happens next.'),
        f('story: a point of view', 2, ['R42.1', 'R40.5'], ['R36.1'], ['family-and-friends', 'school', 'sports-and-leisure'], 'A story told by one child, with a clear opinion and a clear point of view.'),
        f('story: sequence with linking words', 3, ['R42.3', 'R41.3'], ['R37.2'], ['sports-and-leisure', 'travel-and-transport', 'school'], 'A story with linking words (first, then, after that, finally) in a clear order.'),
        f('story: past events', 3, ['L39.2', 'L42.4'], ['L36.2'], ['family-and-friends', 'places-buildings', 'sports-and-leisure'], 'A story or conversation about something that happened. Questions ask about the facts.'),
        f('dialogue: what is not said', 3, ['L41.3', 'L39.3'], ['L37.2'], ['school', 'family-and-friends', 'personal-feelings-opinions-and-experiences'], 'A conversation where an important fact is not stated but the reader can infer it.'),
        f('dialogue: symptoms and illness', 3, ['L39.4', 'L39.5'], ['L38.2'], ['health-medicine-and-exercise', 'the-body-and-the-face', 'school'], 'A child tells a teacher or a doctor about symptoms. Information that the reader already knows helps.'),
        f('dialogue: suggestions', 3, ['R39.5', 'R39.4'], ['L37.3'], ['hobbies-and-leisure', 'places-town-and-city', 'food-and-drink', 'sports-and-leisure'], 'Friends make suggestions ("Let\'s …", "Shall we …?") and give opinions with "because".'),
        f('story: two versions', 2, ['R42.6', 'R40.8'], ['R33.2'], ['school', 'the-natural-world', 'family-and-friends'], 'The text has two short versions of one event. A few details differ.'),
        f('dialogue: a longer dialogue', 3, ['L42.2', 'L42.5'], ['L38.2'], ['school', 'places-buildings', 'travel-and-transport'], 'A longer dialogue of 10 or more turns with ideas that connect.'),
        f('dialogue: two conversations compared', 3, ['L41.4', 'L41.5'], ['L36.4'], ['hobbies-and-leisure', 'food-and-drink', 'places-town-and-city'], 'Two short conversations on the same topic. Some facts are the same and some are different.'),
        f('dialogue: new words from a set', 3, ['L42.6', 'L42.1'], ['R37.3'], ['food-and-drink', 'clothes-and-accessories', 'sport', 'the-natural-world'], 'A dialogue with a few new words from a known set (foods, clothes, sports, animals). Known words explain them.'),
        f('dialogue: opinions', 3, ['R41.1', 'R39.4'], ['L37.3'], ['personal-feelings-opinions-and-experiences', 'school', 'entertainment-and-media'], 'Children give opinions on a film, a game, or a rule with simple reasons.'),
        f('dialogue: detailed instructions', 2, ['L41.1', 'L39.6'], ['L37.1'], ['school', 'sport', 'appliances'], 'Detailed instructions for a task (a science test, a game, a machine), with examples.'),
        f('story: the writer and the reader', 2, ['R40.7', 'R40.1'], ['R35.4'], ['school', 'communication-and-technology', 'family-and-friends'], 'A story told as a letter or a blog, for a clear reader. The reader is easy to find.'),
        f('story: the paragraph topics', 2, ['R41.5', 'R39.3'], ['R38.8'], ['family-and-friends', 'places-countryside', 'school'], 'A descriptive story whose five paragraphs have one topic each.'),
        f('story: a school-club trip', 2, ['R39.7', 'R42.3'], ['R38.9'], ['travel-and-transport', 'places-countryside', 'hobbies-and-leisure'], 'The school club goes on a trip. Specific facts (names, times, places) are in the story.'),
        f('story: examples in a talk', 2, ['L39.6', 'R41.1'], ['L38.1'], ['the-natural-world', 'education', 'sport'], 'A club member gives a talk with examples ("for example", "such as").'),
        f('dialogue: the context of a chat', 2, ['L42.5', 'L41.3'], ['L35.4'], ['places-buildings', 'shopping', 'travel-and-transport'], 'A dialogue where the reader works out the place and the reason for the talk.'),
        n('a school email or message', 3, ['R39.1', 'R40.7'], ['R34.5'], ['communication-and-technology', 'school', 'time'], 'A school email, a text message, and a post on the class blog. Names the person that it was written for.'),
        n('a descriptive text', 2, ['R39.3', 'R41.5'], ['R35.3'], ['the-natural-world', 'places-buildings', 'places-town-and-city'], 'A descriptive text about a place or an animal. The main points are in the paragraphs.'),
        n('a free-time leaflet', 2, ['R39.6', 'R40.9'], ['R34.6'], ['hobbies-and-leisure', 'sport', 'entertainment-and-media'], 'An information leaflet for young people: clubs, times, prices, and rules.'),
        n('short texts with facts', 2, ['R39.7', 'R40.8'], ['R34.3'], ['the-natural-world', 'education', 'travel-and-transport'], 'Short texts on familiar topics with facts to extract.'),
        n('a news story', 2, ['L39.1', 'R40.2'], ['R38.3'], ['places-town-and-city', 'sport', 'the-natural-world', 'school'], 'A short news story with a headline and a picture. The main idea is clear.'),
        n('features of a non-fiction text', 2, ['R40.2', 'R41.4'], ['R34.9'], ['education', 'the-natural-world', 'documents-and-texts'], 'A short non-fiction text with a heading, sub-headings, and a caption. Questions ask where to find facts.'),
        n('word parts', 2, ['R40.3', 'R40.4'], ['R37.3'], ['education', 'communication-and-technology', 'family-and-friends'], 'Words with prefixes and suffixes (un-, re-, -er, -less, -ful, -ly) in a text about the club.'),
        n('a map of a town', 2, ['R40.6'], ['R32.4', 'R33.6'], ['places-town-and-city', 'places-buildings', 'travel-and-transport'], 'Texts about important places in a town (a station, a market, a museum) with a map.'),
        n('who a text is for', 2, ['R40.7', 'R40.9'], ['R39.1'], ['shopping', 'communication-and-technology', 'school'], 'Texts for different readers (a child, a parent, a teacher, a customer). The reader is easy to find.'),
        n('an advertisement', 2, ['R40.9', 'R41.1'], ['R34.8'], ['shopping', 'entertainment-and-media', 'hobbies-and-leisure'], 'An advertisement for a familiar product, a trip, or a film. Key facts and a few opinions.'),
        n('a school fact text', 2, ['R41.2', 'R41.4'], ['R33.2'], ['education', 'the-natural-world', 'measurements'], 'A short factual school text (science, geography, history). The gist is easy to find.'),
        n('a diary in order', 2, ['R41.3', 'R42.3'], ['R38.3'], ['hobbies-and-leisure', 'travel-and-transport', 'sports-and-leisure'], 'A diary with several days. The order of events is clear.'),
        n('scanning a text', 2, ['R41.4', 'R39.7'], ['R34.8'], ['travel-and-transport', 'entertainment-and-media', 'time'], 'A timetable, a program, or a list of facts. Scanning finds one detail fast.'),
        n('paragraph topics', 3, ['R41.5', 'R41.2'], ['R38.8'], ['the-natural-world', 'education', 'places-countryside'], 'A school text of 5 short paragraphs with one topic in each.'),
        n('parts of notes, captions, and blogs', 3, ['R42.5', 'R42.1'], ['R40.2'], ['communication-and-technology', 'school', 'hobbies-and-leisure'], 'A note, a caption, a class blog post, and a set of instructions, each with its parts marked.'),
        n('school-subject texts', 3, ['R42.4', 'R41.2'], ['R40.3'], ['education', 'the-natural-world', 'measurements'], 'A short science or geography text with key words for the subject.'),
        n('two versions of a text', 2, ['R42.6', 'R41.1'], ['R37.4'], ['school', 'sport', 'the-natural-world'], 'Two versions of one notice or one report with a few differences.'),
        n('famous people from the past', 3, ['L42.3', 'L39.2'], ['R37.7'], ['work-and-jobs', 'entertainment-and-media', 'education'], 'A short biography of a famous person: dates, places, and one achievement.'),
        n('a talk with examples', 2, ['L39.6', 'L42.3'], ['L38.1'], ['education', 'the-natural-world', 'sport'], 'The text of a short talk with examples that support the main points.'),
        n('similar passages on one topic', 3, ['L41.5', 'L41.4'], ['R37.4'], ['hobbies-and-leisure', 'travel-and-transport', 'food-and-drink'], 'Two short passages about similar places or things. The reader finds the same and the different facts.'),
        n('an inference from a text', 3, ['L41.3', 'R40.5'], ['R37.10'], ['school', 'the-natural-world', 'family-and-friends'], 'A short text where one fact is not stated but is clear from the other facts.'),
        n('detailed instructions', 3, ['L41.1', 'R40.8'], ['R36.2'], ['appliances', 'food-and-drink', 'education'], 'A detailed set of instructions for a task (a science test, a recipe, a model).'),
        n('symptoms and health', 2, ['L39.4', 'R40.8'], ['L38.2'], ['health-medicine-and-exercise', 'the-body-and-the-face'], 'A health leaflet or a school nurse note about symptoms and what to do.'),
        n('a new word from a word set', 2, ['L42.1', 'L42.6'], ['R37.3'], ['clothes-and-accessories', 'food-and-drink', 'sport', 'the-natural-world'], 'A text with a word set (sports, foods, clothes, animals) and one or two new words in the set.'),
        n('opinions and reasons', 3, ['R41.1', 'R39.4'], ['R38.7'], ['personal-feelings-opinions-and-experiences', 'entertainment-and-media', 'school'], 'A blog post or a poster with opinions and reasons ("because").'),
    ],
};

/** Fills the optional parts of a template list so that all fields are present. */
export function bankTemplates(level: number): BankTemplate[] {
    return (BANK_TEMPLATES[level] ?? []).map((t) => ({ ...t, supporting: t.supporting ?? [], note: `${t.note} ${CAST[level]}` }));
}

/** One planned article before the writer merges it with old-id data. */
export interface BankRow {
    lesson: string;
    type: string;
    app: 'fiction' | 'nonfiction';
    objectives: string[];
    supporting: string[];
    topics: [string, string];
    requiredGlossed: string[];
    note: string;
}

/**
 * Picks the topics of article `i` of a template.
 * @param t the template
 * @param i the position of the article inside the template
 * @returns the primary and the secondary topic (always two different topics)
 */
export function pickTopics(t: BankTemplate, i: number): [string, string] {
    const primary = t.topics[i % t.topics.length];
    let secondary = t.topics[(i + 1) % t.topics.length];
    if (secondary === primary) secondary = t.topics.find((x) => x !== primary) ?? primary;
    return [primary, secondary];
}

/**
 * Writes a topic key in American spelling.
 * @param key a topic key from a word list or from a text type spec
 * @returns the key with American spelling ("colours" becomes "colors")
 */
export function americanTopic(key: string): string {
    return key === 'colours' ? 'colors' : key;
}

/**
 * Writes the word lists in American spelling. A word that appears twice after the change (for
 * example "program" and "programme") stays once, in its first topic.
 * @param pools the word lists by topic
 * @returns new pools with American words and American topic keys
 */
export function normalizePools(pools: WordPools): WordPools {
    const out = {} as WordPools;
    for (const list of Object.keys(pools) as WordList[]) {
        const seen = new Set<string>();
        out[list] = {};
        for (const [key, words] of Object.entries(pools[list])) {
            const topic = americanTopic(key);
            const fresh = words.map(americanSpelling).filter((w) => !seen.has(w) && seen.add(w));
            out[list][topic] = [...(out[list][topic] ?? []), ...fresh];
        }
    }
    return out;
}

/** Shared state of the word plan: how often each word is required so far (across levels). */
export type UsedCounts = Map<string, number>;

/** The words of one article for one list: `count` places, filled by the rotation. */
interface Segment {
    index: number;
    list: WordList;
    count: number;
    topics: [string, string];
    words: string[];
}

/**
 * Assigns the required glossed words of the articles of one level.
 * Rule 1 (rotation): the words that are used least come first, so that each word of a list is
 * required once before any word is required a second time (the counts in `used` carry over from
 * earlier levels).
 * Rule 2 (topics): in each round, a word with a topic goes to an article that has the topic, the
 * scarcest topics last. An article takes at most 2 of its words from its second topic first.
 * Rule 3 (function words): a word with no topic at this level ("any", "along", "would") goes into
 * the places that rule 2 leaves, spread evenly over the articles (each article keeps a share
 * in proportion to the number of such words).
 * Rule 4: a topic word with no place left in its topics fills a free place of another article, so
 * that the rotation does not stop.
 * @param level the level (5-9)
 * @param topics the two topics of each article, in plan order
 * @param pools the word lists by topic, without the words that a package already glossed
 * @param used how often each word is required so far; the function adds the new uses
 * @returns the words of each article, in the order of `topics`, and the cover-list words that no article got
 */
export function assignWords(level: number, topics: [string, string][], pools: WordPools, used: UsedCounts): { words: string[][]; uncovered: string[] } {
    const segments: Segment[] = topics.flatMap((tp, index) => wordSegments(level, index).map(({ list, count }) => ({ index, list, count, topics: tp, words: [] })));
    const levelGroups = new Set(topics.flat().map(topicGroup));
    const use = (w: string) => used.set(w, (used.get(w) ?? 0) + 1);
    const uses = (w: string) => used.get(w) ?? 0;
    const place = (s: Segment, w: string) => {
        s.words.push(w);
        use(w);
    };
    const free = (s: Segment) => s.count - s.words.length;
    /** The segment with most free places (then lowest index) among those that pass `ok`. */
    const roomiest = (segs: Segment[], w: string, ok: (s: Segment) => boolean = () => true) =>
        segs.filter((s) => free(s) > 0 && !s.words.includes(w) && ok(s)).sort((a, b) => free(b) - free(a) || a.index - b.index)[0];
    for (const list of ['movers', 'flyers', 'a2key'] as WordList[]) {
        const segs = segments.filter((s) => s.list === list);
        if (!segs.length) continue;
        const keyOf = new Map<string, string>();
        for (const [key, ws] of Object.entries(pools[list])) for (const w of ws) if (!keyOf.has(w)) keyOf.set(w, key);
        const all = [...keyOf.keys()];
        const groupOf = (w: string) => topicGroup(keyOf.get(w)!);
        const bound = (w: string) => levelGroups.has(groupOf(w));
        let stuck = 0;
        while (segs.some((s) => free(s) > 0) && stuck < 2) {
            const floor = Math.min(...all.map(uses));
            const round = all.filter((w) => uses(w) === floor);
            const before = segs.reduce((n, s) => n + s.words.length, 0);
            const slots = segs.reduce((n, s) => n + free(s), 0);
            const topicWords = round.filter(bound);
            const spread = round.filter((w) => !bound(w));
            // Each segment keeps a share of its places for words with no topic.
            const keep = new Map(segs.map((s) => [s, Math.round((free(s) * spread.length) / Math.max(1, round.length))]));
            const fits = (s: Segment, w: string) => s.topics.some((t) => topicGroup(t) === groupOf(w));
            // Rule 2: topic words, the groups with the most free places for each word first.
            const groups = [...new Set(topicWords.map(groupOf))].sort((a, b) => {
                const room = (g: string) => segs.filter((s) => s.topics.some((t) => topicGroup(t) === g)).reduce((n, s) => n + free(s), 0);
                const load = (g: string) => topicWords.filter((w) => groupOf(w) === g).length / Math.max(1, room(g));
                return load(a) - load(b) || a.localeCompare(b);
            });
            const left: string[] = [];
            for (const g of groups) {
                for (const w of topicWords.filter((x) => groupOf(x) === g)) {
                    const second = (s: Segment) => topicGroup(s.topics[0]) !== g;
                    // A first pass limits the words of the second topic; a second pass does not.
                    const target =
                        roomiest(segs, w, (s) => fits(s, w) && free(s) > keep.get(s)! && (!second(s) || s.words.filter((x) => topicGroup(s.topics[0]) !== groupOf(x)).length < 2)) ??
                        roomiest(segs, w, (s) => fits(s, w) && free(s) > keep.get(s)!);
                    if (target) place(target, w);
                    else left.push(w);
                }
            }
            // Rule 3: words with no topic, evenly.
            for (const w of spread) {
                const target = roomiest(segs, w);
                if (target) place(target, w);
            }
            // Rule 4: topic words with no place in their topics.
            for (const w of left) {
                const target = roomiest(segs, w, (s) => fits(s, w)) ?? roomiest(segs, w);
                if (target) place(target, w);
            }
            stuck = segs.reduce((n, s) => n + s.words.length, 0) === before || slots === 0 ? stuck + 1 : 0;
        }
        // Rule 5: a topic word in an article that lacks its topic swaps with a word with no topic
        // in an article that has the topic. The use counts do not change.
        const fitsTopic = (s: Segment, w: string) => s.topics.some((t) => topicGroup(t) === groupOf(w));
        for (const s of segs) {
            for (let k = 0; k < s.words.length; k++) {
                const w = s.words[k];
                if (!bound(w) || fitsTopic(s, w)) continue;
                for (const t of segs) {
                    if (t === s || !fitsTopic(t, w) || t.words.includes(w)) continue;
                    const at = t.words.findIndex((x) => !bound(x) && !s.words.includes(x));
                    if (at < 0) continue;
                    s.words[k] = t.words[at];
                    t.words[at] = w;
                    break;
                }
            }
        }
    }
    const uncovered: string[] = [];
    for (const list of COVER_LISTS[level] ?? []) {
        for (const ws of Object.values(pools[list])) for (const w of ws) if (!uses(w) && !uncovered.includes(w)) uncovered.push(w);
    }
    const words = topics.map((_, i) => segments.filter((s) => s.index === i).flatMap((s) => s.words));
    // No two articles may get the same set of words.
    const listWords = (list: WordList) => [...new Set(Object.values(pools[list]).flat())];
    const seen = new Set<string>();
    words.forEach((ws, i) => {
        let key = [...ws].sort().join(',');
        let guard = 0;
        while (seen.has(key) && guard++ < 50) {
            const list = wordSegments(level, i).at(-1)!.list;
            const spare = listWords(list).filter((x) => !ws.includes(x)).sort((a, b) => uses(a) - uses(b) || a.localeCompare(b))[0];
            if (!spare) break;
            const old = ws.pop()!;
            used.set(old, uses(old) - 1);
            ws.push(spare);
            use(spare);
            key = [...ws].sort().join(',');
        }
        seen.add(key);
    });
    return { words, uncovered };
}

/**
 * Builds the rows of a level bank, with the glossed words.
 * @param level the level (5-9)
 * @param pools the word lists by topic, without the words that a package already glossed (British headwords; the rows get American spelling)
 * @param used the required-word counts so far, keyed by American spelling; pass the same map for levels 5, 6, ... in order
 * @returns the rows in plan order, and the list words that no article could take
 */
export function buildBankRows(level: number, pools: WordPools, used: UsedCounts): { rows: BankRow[]; uncovered: string[] } {
    const specs: { t: BankTemplate; topics: [string, string] }[] = [];
    for (const t of bankTemplates(level)) for (let i = 0; i < t.count; i++) specs.push({ t, topics: pickTopics(t, i) });
    if (specs.length !== BANK_COUNTS[level]) throw new Error(`level ${level}: ${specs.length} planned articles, expected ${BANK_COUNTS[level]}`);
    const { words, uncovered } = assignWords(level, specs.map((s) => s.topics), normalizePools(pools), used);
    const rows = specs.map((s, i) => ({
        lesson: `b${String(i + 1).padStart(3, '0')}`,
        type: s.t.type,
        app: s.t.app,
        objectives: s.t.objectives,
        supporting: s.t.supporting ?? [],
        topics: [americanTopic(s.topics[0]), americanTopic(s.topics[1])] as [string, string],
        requiredGlossed: words[i],
        note: s.t.note,
    }));
    return { rows, uncovered };
}

/**
 * Counts how often each objective is a target in the rows.
 * @param rows planned articles
 * @returns a map from objective id to the number of articles that target it
 */
export function targetCounts(rows: Pick<BankRow, 'objectives'>[]): Map<string, number> {
    const out = new Map<string, number>();
    for (const r of rows) for (const id of new Set(r.objectives)) out.set(id, (out.get(id) ?? 0) + 1);
    return out;
}
