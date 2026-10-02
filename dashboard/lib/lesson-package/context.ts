import path from 'path';
import { loadVocabularyIndex, type VocabularyIndex } from '../text-profile/vocabulary';
import { loadLessonFolder, type LessonText } from '../text-profile/sources';
import { CONTENT_ROOT, REPO_ROOT, loadObjectiveIds, priorPackageTexts } from './files';
import type { PackageCheckContext } from './checks';
import type { LessonPackage } from './schema';

export const DEFAULT_GRAPH = path.resolve(REPO_ROOT, '..', 'mastery-advantage/english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json');
const PRINTED = ['primary/origins-2-a0', 'primary/origins-3.1-a0'].map((p) => path.join(REPO_ROOT, p));

let cache: { graph: string; index: VocabularyIndex; printed: LessonText[]; objectiveIds: Set<string> } | undefined;

/**
 * The check context for a package: the vocabulary graph, the printed Origins 2 and 3.1 lessons,
 * the earlier packages (BOOK_ORDER), and the objective key. The graph and the printed lessons load
 * once per process.
 * @param pkg A parsed package.
 * @param graph Vocabulary graph path (default: MASTERY_VOCAB_GRAPH or the mastery-advantage repo).
 * @returns The context for `checkPackage`.
 */
export function checkContextFor(pkg: LessonPackage, graph: string = process.env.MASTERY_VOCAB_GRAPH || DEFAULT_GRAPH): PackageCheckContext {
    if (!cache || cache.graph !== graph) {
        cache = { graph, index: loadVocabularyIndex(graph), printed: PRINTED.flatMap((p) => loadLessonFolder(p)), objectiveIds: loadObjectiveIds() };
    }
    // Origins 1 comes before the printed Origins 2 and 3.1, so only its own earlier lessons count.
    const printed = pkg.meta.book === 'origins-1' ? [] : cache.printed;
    return {
        index: cache.index,
        prior: [...printed, ...priorPackageTexts(CONTENT_ROOT, pkg.meta.book, pkg.meta.number)],
        objectiveIds: cache.objectiveIds,
    };
}
